from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from .. import database, models, schemas

router = APIRouter(
    prefix="/api/v1",
    tags=["data"]
)

from typing import Optional

def calculate_status(
    gas: Optional[float], 
    temperature: Optional[float], 
    distance: Optional[float],
    iaq: Optional[int] = None
) -> str:
    # If Air Quality Index (IAQ) is present, use it for evaluation
    if iaq is not None:
        if iaq > 250:
            return "DANGER"
        elif iaq > 100:
            return "WARNING"
        return "SAFE"

    # Handle missing values safely for standard gas sensor
    gas_val = gas if gas is not None else 0.0
    dist_val = distance if distance is not None else 9999.0 # Default to safe distance
    temp_val = temperature if temperature is not None else 0.0

    if gas_val > 1000 or dist_val < 20: 
        return "DANGER"
    elif gas_val > 500 or temp_val > 40:
        return "WARNING"
    return "SAFE"

@router.post("/ingest", response_model=schemas.SensorDataResponse)
def ingest_data(
    data: schemas.SensorDataCreate, 
    device_token: str = Header(..., alias="Device-Token"), # ESP32 sends this header
    db: Session = Depends(database.get_db)
):
    # Authenticate device
    device = db.query(models.Device).filter(models.Device.device_id == data.device_id).first()
    if not device:
         raise HTTPException(status_code=404, detail="Device not found")
    
    # Secure header check (simple string match)
    if device.device_token != device_token:
        raise HTTPException(status_code=401, detail="Invalid Device Token")

    status_val = calculate_status(data.gas, data.temperature, data.distance, data.iaq)

    new_reading = models.SensorData(
        device_id=data.device_id,
        gas=data.gas,
        temperature=data.temperature,
        humidity=data.humidity,
        distance=data.distance,
        co2=data.co2,
        oxygen=data.oxygen,
        voc=data.voc,
        hcho=data.hcho,
        pressure=data.pressure,
        pm25=data.pm25,
        pm10=data.pm10,
        iaq=data.iaq,
        status=status_val
    )
    
    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)
    
    return new_reading
