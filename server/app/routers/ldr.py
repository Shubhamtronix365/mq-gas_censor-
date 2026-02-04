from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import Device, LDRReading, DeviceOutput
from ..schemas import LDRReadingCreate, LDRReadingResponse, DeviceOutputCreate, DeviceOutputResponse, DeviceOutputUpdate
from ..auth import get_current_user

router = APIRouter(
    prefix="/api/v1/ldr",
    tags=["ldr"],
)

# --- LDR READINGS ---

@router.post("/{device_id}/readings", response_model=LDRReadingResponse)
def create_ldr_reading(
    device_id: str,
    reading: LDRReadingCreate,
    device_token: str = Header(..., alias="Device-Token"),
    db: Session = Depends(get_db)
):
    # Verify device exists
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Verify Token
    if device.device_token != device_token:
        raise HTTPException(status_code=401, detail="Invalid Device Token")

    db_reading = LDRReading(
        device_id=device_id,
        digital_value=reading.digital_value,
        analog_value=reading.analog_value
    )
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading

@router.get("/{device_id}/readings", response_model=List[LDRReadingResponse])
def get_ldr_readings(
    device_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verify device belongs to user
    device = db.query(Device).filter(Device.device_id == device_id, Device.owner_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found or access denied")

    readings = db.query(LDRReading).filter(LDRReading.device_id == device_id).order_by(LDRReading.timestamp.desc()).limit(limit).all()
    return readings

# --- DEVICE OUTPUTS ---

@router.post("/{device_id}/outputs", response_model=DeviceOutputResponse)
def create_output(
    device_id: str,
    output: DeviceOutputCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verify device ownership
    device = db.query(Device).filter(Device.device_id == device_id, Device.owner_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found or access denied")

    db_output = DeviceOutput(
        device_id=device_id,
        output_name=output.output_name,
        gpio_pin=output.gpio_pin,
        is_active=output.is_active
    )
    db.add(db_output)
    db.commit()
    db.refresh(db_output)
    return db_output

@router.get("/{device_id}/outputs", response_model=List[DeviceOutputResponse])
def get_outputs(
    device_id: str,
    db: Session = Depends(get_db)
    # Note: ESP32 needs to access this without user auth token, usually via device token
    # For now ensuring it's open or checking device_token in headers if implemented
):
    outputs = db.query(DeviceOutput).filter(DeviceOutput.device_id == device_id).all()
    return outputs

@router.put("/outputs/{output_id}", response_model=DeviceOutputResponse)
def update_output_state(
    output_id: int,
    state: DeviceOutputUpdate,
    db: Session = Depends(get_db),
    # User auth required for switching standard control
    current_user = Depends(get_current_user) 
):
    output = db.query(DeviceOutput).filter(DeviceOutput.id == output_id).first()
    if not output:
        raise HTTPException(status_code=404, detail="Output not found")
    
    # Check ownership
    device = db.query(Device).filter(Device.device_id == output.device_id, Device.owner_id == current_user.id).first()
    if not device:
         raise HTTPException(status_code=403, detail="Access denied")

    output.is_active = state.is_active
    output.last_updated = datetime.utcnow()
    db.commit()
    db.refresh(output)
    return output
