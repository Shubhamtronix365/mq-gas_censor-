from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from .. import database, models, schemas, auth

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["admin"]
)

# ── Admin dependency — rejects non-admin tokens ────────────────────────────
def require_admin(current_user: models.User = Depends(auth.get_current_user)) -> models.User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )
    return current_user

# ── Stats ──────────────────────────────────────────────────────────────────
@router.get("/stats", response_model=schemas.AdminStatsResponse)
def get_admin_stats(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(database.get_db)
):
    users = db.query(models.User).all()
    total_devices = db.query(models.Device).count()

    plan_dist: dict = {}
    active_subs = 0
    for u in users:
        plan = u.subscription_plan or "free"
        plan_dist[plan] = plan_dist.get(plan, 0) + 1
        if u.subscription_status == "active" and plan not in ("free", "none"):
            active_subs += 1

    return {
        "total_users": len(users),
        "total_devices": total_devices,
        "total_admins": sum(1 for u in users if u.is_admin),
        "plan_distribution": plan_dist,
        "active_subscriptions": active_subs,
    }

# ── Users ──────────────────────────────────────────────────────────────────
@router.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(database.get_db)
):
    return db.query(models.User).offset(skip).limit(limit).all()

@router.put("/users/{user_id}/subscription", response_model=schemas.UserResponse)
def admin_update_user_subscription(
    user_id: int,
    update: schemas.AdminUserSubscriptionUpdate,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.subscription_plan = update.subscription_plan
    user.subscription_status = update.subscription_status
    user.subscription_currency = update.subscription_currency
    user.subscription_expiry = update.subscription_expiry
    db.commit()
    db.refresh(user)

    print(f"[Admin] {admin.email} updated user {user.email} → plan={update.subscription_plan}")
    return user

# ── Plan Configs ───────────────────────────────────────────────────────────
@router.get("/plans", response_model=List[schemas.PlanConfigResponse])
def get_all_plans(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(database.get_db)
):
    plans = db.query(models.PlanConfig).all()
    return plans

@router.get("/plans/public", response_model=List[schemas.PlanConfigResponse])
def get_public_plans(db: Session = Depends(database.get_db)):
    """Public endpoint — no auth required. Used by Subscription.jsx to fetch live plan data."""
    return db.query(models.PlanConfig).filter(models.PlanConfig.is_active == True).all()

@router.put("/plans/{plan_id}", response_model=schemas.PlanConfigResponse)
def update_plan_config(
    plan_id: str,
    update: schemas.PlanConfigUpdate,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(database.get_db)
):
    plan = db.query(models.PlanConfig).filter(models.PlanConfig.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan '{plan_id}' not found")

    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)

    plan.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(plan)

    print(f"[Admin] {admin.email} updated plan '{plan_id}': {update_data}")
    return plan

# ── Password Change ────────────────────────────────────────────────────────
@router.put("/change-password")
def admin_change_password(
    body: schemas.AdminPasswordChange,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(database.get_db)
):
    if not auth.verify_password(body.current_password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )

    admin_obj = db.query(models.User).filter(models.User.id == admin.id).first()
    admin_obj.hashed_password = auth.get_password_hash(body.new_password)
    db.commit()

    print(f"[Admin] {admin.email} changed their admin password.")
    return {"message": "Admin password updated successfully"}
