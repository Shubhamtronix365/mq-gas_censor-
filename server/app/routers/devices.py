from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import secrets
from .. import database, models, schemas, auth

router = APIRouter(
    prefix="/api/v1/devices",
    tags=["devices"]
)

@router.get("/", response_model=List[schemas.DeviceResponse])
def get_my_devices(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return current_user.devices

@router.get("/{device_id}", response_model=schemas.DeviceResponse)
def get_device(device_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    device = db.query(models.Device).filter(models.Device.device_id == device_id, models.Device.owner_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@router.post("/", response_model=schemas.DeviceResponse)
def create_device(device: schemas.DeviceBase, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Check if device ID already exists
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
    return new_device

@router.get("/{device_id}/readings", response_model=List[schemas.SensorDataResponse])
def get_device_readings(device_id: str, limit: int = 20, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Verify ownership
    device = db.query(models.Device).filter(models.Device.device_id == device_id, models.Device.owner_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
        
    readings = db.query(models.SensorData).filter(models.SensorData.device_id == device_id).order_by(models.SensorData.timestamp.desc()).limit(limit).all()
    # Return reversed to show chronological order in graphs if needed, but API usually sends latest first or user sorts. 
    # Let's return latest first (descending) as queried. Frontend can reverse.
    return readings

@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(device_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Verify ownership
    device = db.query(models.Device).filter(models.Device.device_id == device_id, models.Device.owner_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Delete associated readings first (optional if cascade is set, but good for safety)
    # Delete associated readings first (optional if cascade is set, but good for safety)
    db.query(models.SensorData).filter(models.SensorData.device_id == device_id).delete()
    db.query(models.LDRReading).filter(models.LDRReading.device_id == device_id).delete()
    db.query(models.DeviceOutput).filter(models.DeviceOutput.device_id == device_id).delete()
    
    # Delete the device
    db.delete(device)
    db.commit()
    return None
