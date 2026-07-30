from fastapi import APIRouter, Depends, HTTPException, status
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
def update_user_me(user_update: schemas.UserUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Fetch fresh user object to ensure attached to session
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.phone_number is not None:
        user.phone_number = user_update.phone_number
    if user_update.preferences is not None:
        # Merge policies or full replace? 
        # Typically simple replacement or dictionary merge. 
        # For simplicity, let's do a merge if existing is dict
        current_prefs = user.preferences or {}
        if isinstance(current_prefs, dict):
            # Shallow merge
            updated_prefs = {**current_prefs, **user_update.preferences}
            user.preferences = updated_prefs
        else:
            user.preferences = user_update.preferences
            
    db.commit()
    db.refresh(user)
    return user

@router.put("/me/subscription", response_model=schemas.UserResponse)
def update_user_subscription(
    sub_update: schemas.SubscriptionUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    user.subscription_plan = sub_update.subscription_plan
    user.subscription_status = sub_update.subscription_status
    user.subscription_currency = sub_update.subscription_currency
    user.subscription_expiry = sub_update.subscription_expiry
    db.commit()
    db.refresh(user)
    return user
