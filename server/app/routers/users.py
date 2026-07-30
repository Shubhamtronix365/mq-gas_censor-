from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from .. import database, models, schemas, auth

router = APIRouter(
    prefix="/api/v1/users",
    tags=["users"]
)

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_user_me(
    user_update: schemas.UserUpdate, 
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    # Fetch fresh user object to ensure attached to session
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.phone_number is not None:
        user.phone_number = user_update.phone_number
        
    if user_update.preferences is not None:
        if user.preferences:
            current_prefs = dict(user.preferences)
            updated_prefs = {**current_prefs, **user_update.preferences}
            user.preferences = updated_prefs
        else:
            user.preferences = user_update.preferences
            
    db.commit()
    db.refresh(user)
    
    # Send a notification email for profile setting update
    from ..utils import email as email_utils
    background_tasks.add_task(
        email_utils.send_general_notification_email,
        user_email=user.email,
        subject="⚙️ Profile Updated - Tronix365",
        title="Workspace Profile Updated",
        description="Your administrator profile details or preferences have been successfully updated in the SenseGrid system."
    )
    
    return user

@router.put("/me/subscription", response_model=schemas.UserResponse)
def update_user_subscription(
    sub_update: schemas.SubscriptionUpdate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    
    old_plan = user.subscription_plan
    
    user.subscription_plan = sub_update.subscription_plan
    user.subscription_status = sub_update.subscription_status
    user.subscription_currency = sub_update.subscription_currency
    user.subscription_expiry = sub_update.subscription_expiry
    db.commit()
    db.refresh(user)
    
    # Check if downgraded / cancelled subscription
    if old_plan and old_plan != "free" and sub_update.subscription_plan == "free":
        from ..utils import email as email_utils
        background_tasks.add_task(
            email_utils.send_subscription_cancellation_email,
            user_email=user.email,
            full_name=user.full_name or "IoT Administrator",
            plan_name=old_plan
        )
        
    return user
