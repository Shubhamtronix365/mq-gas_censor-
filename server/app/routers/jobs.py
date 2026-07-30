from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from .. import database, models
from ..utils import email as email_utils

router = APIRouter(
    prefix="/api/v1/jobs",
    tags=["jobs"]
)

@router.post("/check-expiring-subscriptions")
def check_expiring_subscriptions(
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
    """
    Cron-triggered job to scan for active subscriptions expiring exactly 7 days from now,
    and dispatch email warnings.
    """
    now = datetime.now(timezone.utc)
    
    # Query all users with active subscription expiries
    users = db.query(models.User).filter(
        models.User.subscription_plan != "free",
        models.User.subscription_plan != "none",
        models.User.subscription_expiry.isnot(None)
    ).all()
    
    notified_users = []
    
    for user in users:
        # Ensure user.subscription_expiry is timezone-aware
        expiry = user.subscription_expiry
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
            
        time_left = expiry - now
        days_left = time_left.days
        
        # Check if the subscription is expiring in exactly 7 days (days_left == 7)
        if days_left == 7:
            expiry_str = expiry.strftime("%Y-%m-%d %H:%M:%S UTC")
            background_tasks.add_task(
                email_utils.send_subscription_expiry_warning_email,
                user_email=user.email,
                full_name=user.full_name or "IoT Administrator",
                plan_name=user.subscription_plan,
                expiry_date_str=expiry_str,
                days_left=7
            )
            notified_users.append({
                "email": user.email,
                "days_left": days_left,
                "expiry": expiry_str
            })
            
    return {
        "status": "success",
        "checked_at": now.isoformat(),
        "notifications_dispatched": len(notified_users),
        "recipients": notified_users
    }
