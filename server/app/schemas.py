from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class UserResponse(UserBase):
    id: int
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

# Device Schemas
class DeviceBase(BaseModel):
    device_id: str
    device_type: Optional[str] = "gas_sensor"

class DeviceCreate(DeviceBase):
    device_token: str

class DeviceResponse(DeviceBase):
    device_token: str
    created_at: datetime
    class Config:
        from_attributes = True

# Sensor Data Schemas
class SensorDataCreate(BaseModel):
    device_id: str
    gas: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    distance: Optional[float] = None

class SensorDataResponse(SensorDataCreate):
    id: int
    timestamp: datetime
    status: str
    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# LDR Schemas
class LDRReadingCreate(BaseModel):
    device_id: str
    digital_value: bool
    analog_value: int

class LDRReadingResponse(LDRReadingCreate):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True

# Output Schemas
class DeviceOutputCreate(BaseModel):
    device_id: str
    output_name: str
    gpio_pin: int
    is_active: bool = False

class DeviceOutputUpdate(BaseModel):
    is_active: bool

class DeviceOutputResponse(DeviceOutputCreate):
    id: int
    last_updated: datetime
    class Config:
        from_attributes = True
