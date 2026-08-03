from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import secrets
from .. import database, models, schemas, auth

router = APIRouter(
    prefix="/api/v1/devices",
    tags=["devices"]
)

# ── Subscription plan → maximum allowed devices ────────────────────────────
# "free" and any unrecognized plan both get the Free tier limit
PLAN_DEVICE_LIMITS = {
    "free":         2,
    "starter":      5,
    "professional": 15,
    "enterprise":   100,   # effectively unlimited for most use-cases
}

def get_device_limit(plan: str) -> int:
    """Return the max nodes allowed for a given subscription plan name."""
    return PLAN_DEVICE_LIMITS.get((plan or "free").lower(), 2)

from datetime import datetime
from fastapi import Header

ONLINE_TIMEOUT_SECONDS = 30

def format_device_response(device: models.Device) -> dict:
    now = datetime.utcnow()
    last_seen = device.last_seen
    is_online = False
    if last_seen:
        is_online = (now - last_seen).total_seconds() <= ONLINE_TIMEOUT_SECONDS

    return {
        "device_id": device.device_id,
        "device_type": device.device_type,
        "device_token": device.device_token,
        "created_at": device.created_at,
        "last_seen": device.last_seen,
        "is_online": is_online
    }

@router.get("/", response_model=List[schemas.DeviceResponse])
def get_my_devices(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return [format_device_response(d) for d in current_user.devices]

@router.get("/limit-info")
def get_device_limit_info(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    """Returns the user's current device count, plan limit, and plan name."""
    plan = (current_user.subscription_plan or "free").lower()
    limit = get_device_limit(plan)
    count = len(current_user.devices)
    return {
        "plan":       plan,
        "limit":      limit,
        "used":       count,
        "remaining":  max(0, limit - count),
        "at_limit":   count >= limit,
    }

from sqlalchemy import func
import urllib.parse

@router.get("/{device_id}", response_model=schemas.DeviceResponse)
def get_device(device_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    clean_id = urllib.parse.unquote(device_id).strip()
    device = db.query(models.Device).filter(
        func.lower(models.Device.device_id) == func.lower(clean_id),
        models.Device.owner_id == current_user.id
    ).first()
    if not device:
        # Fallback exact match
        device = db.query(models.Device).filter(
            models.Device.device_id == clean_id,
            models.Device.owner_id == current_user.id
        ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return format_device_response(device)

@router.post("/{device_id}/ping")
def ping_device(
    device_id: str,
    device_token: str = Header(..., alias="Device-Token"),
    db: Session = Depends(database.get_db)
):
    """Heartbeat endpoint for ESP32 nodes to maintain active Online status."""
    device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if device.device_token != device_token:
        raise HTTPException(status_code=401, detail="Invalid Device Token")

    device.last_seen = datetime.utcnow()
    db.commit()
    return {"status": "ok", "device_id": device_id, "is_online": True, "last_seen": device.last_seen}

@router.post("/", response_model=schemas.DeviceResponse)
def create_device(device: schemas.DeviceBase, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # ── Admin bypass — unlimited nodes ─────────────────────────────────────
    if current_user.is_admin:
        print(f"[Devices] Admin {current_user.email} deploying node — limit check bypassed")
    else:
        # ── Plan limit check ────────────────────────────────────────────────
        plan = (current_user.subscription_plan or "free").lower()
        limit = get_device_limit(plan)
        current_count = db.query(models.Device).filter(models.Device.owner_id == current_user.id).count()

        if current_count >= limit:
            plan_display = plan.capitalize()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Device limit reached. Your {plan_display} plan allows a maximum of {limit} node(s). "
                    f"You currently have {current_count}/{limit}. "
                    f"Upgrade your subscription to add more nodes."
                )
            )

    # Check if device ID already exists globally
    existing_device = db.query(models.Device).filter(models.Device.device_id == device.device_id).first()
    if existing_device:
        raise HTTPException(status_code=400, detail="Device ID already registered")
    
    # Generate a random token for the device
    token = secrets.token_hex(16)
    
    new_device = models.Device(
        device_id=device.device_id,
        owner_id=current_user.id,
        device_token=token,
        device_type=device.device_type
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    
    print(f"[Devices] Node deployed: {device.device_id} (type={device.device_type}) for user={current_user.email} [{current_count + 1}/{limit} on {plan}]")
    return new_device

@router.get("/{device_id}/readings", response_model=List[schemas.SensorDataResponse])
def get_device_readings(device_id: str, limit: int = 20, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Verify ownership
    device = db.query(models.Device).filter(models.Device.device_id == device_id, models.Device.owner_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
        
    readings = db.query(models.SensorData).filter(models.SensorData.device_id == device_id).order_by(models.SensorData.timestamp.desc()).limit(limit).all()
    return readings

@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(device_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Verify ownership
    device = db.query(models.Device).filter(models.Device.device_id == device_id, models.Device.owner_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Delete associated readings first (cascade safety)
    db.query(models.SensorData).filter(models.SensorData.device_id == device_id).delete()
    db.query(models.LDRReading).filter(models.LDRReading.device_id == device_id).delete()
    db.query(models.DeviceOutput).filter(models.DeviceOutput.device_id == device_id).delete()
    
    # Delete the device
    db.delete(device)
    db.commit()
    return None
