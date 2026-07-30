from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
import httpx
from .. import database, models, schemas, auth

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

@router.post("/register", response_model=schemas.UserResponse)
def register(
    user: schemas.UserCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
    try:
        print(f"Attempting to register user: {user.email}")
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        print("Hashing password...")
        hashed_password = auth.get_password_hash(user.password)
        print("Creating user object...")
        new_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name, phone_number=user.phone_number)
        print("Adding to DB...")
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print("User registered successfully.")
        
        # Send Welcome Notification email using background task
        from ..utils import email as email_utils
        background_tasks.add_task(
            email_utils.send_general_notification_email,
            user_email=new_user.email,
            subject="🚀 Welcome to Tronix365 SenseGrid!",
            title="IoT Control Center Initialized",
            description=f"Welcome {new_user.full_name or 'Administrator'}! Your SenseGrid workspace node has been successfully provisioned. You can now add IoT devices and start streaming real-time sensor parameters."
        )
        
        return new_user
    except ValueError as ve:
        print(f"Validation error registering user: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR registering user: {e}")
        raise e

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=schemas.Token)
async def google_login(payload: schemas.GoogleLoginRequest, db: Session = Depends(database.get_db)):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.credential}",
                timeout=10.0
            )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google credential token"
            )
            
        token_info = response.json()
        email = token_info.get("email")
        google_id = token_info.get("sub")
        name = token_info.get("name")
        
        if not email or not google_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google payload data"
            )
            
        user = db.query(models.User).filter(models.User.google_id == google_id).first()
        
        if not user:
            user = db.query(models.User).filter(models.User.email == email).first()
            if user:
                user.google_id = google_id
                if not user.full_name and name:
                    user.full_name = name
                db.commit()
            else:
                user = models.User(
                    email=email,
                    google_id=google_id,
                    full_name=name,
                    hashed_password=None
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                
        access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Google login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google login failed: {str(e)}"
        )
