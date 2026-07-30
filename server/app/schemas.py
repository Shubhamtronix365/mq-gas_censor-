import re
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

# User Schemas
class UserBase(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email address format")
        return v.lower().strip()

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=64)
    full_name: Optional[str] = None
    phone_number: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class UserResponse(UserBase):
    id: int
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    subscription_plan: Optional[str] = "starter"
    subscription_status: Optional[str] = "active"
    subscription_currency: Optional[str] = "INR"
    subscription_expiry: Optional[datetime] = None
    google_id: Optional[str] = None
    
    class Config:
        from_attributes = True

class SubscriptionUpdate(BaseModel):
    subscription_plan: str
    subscription_status: Optional[str] = "active"
    subscription_currency: Optional[str] = "INR"
    subscription_expiry: Optional[datetime] = None

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
    co2: Optional[float] = None
    oxygen: Optional[float] = None
    voc: Optional[int] = None
    hcho: Optional[float] = None
    pressure: Optional[float] = None
    pm25: Optional[float] = Field(None, alias="pm2.5")
    pm10: Optional[float] = None
    iaq: Optional[int] = None
    kwh: Optional[float] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class SensorDataResponse(SensorDataCreate):
    id: int
    timestamp: datetime
    status: str
    class Config:
        from_attributes = True
        populate_by_name = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    credential: str

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
