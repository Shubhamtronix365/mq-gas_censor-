from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    preferences = Column(JSON, default={})
    hashed_password = Column(String)
    
    devices = relationship("Device", back_populates="owner")

class Device(Base):
    __tablename__ = "devices"

    device_id = Column(String, primary_key=True, index=True) # e.g. "ESP32_01"
    owner_id = Column(Integer, ForeignKey("users.id"))
    device_token = Column(String) # For ESP32 authentication
    device_type = Column(String, default="gas_sensor") # gas_sensor, ldr_sensor
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="devices")
    readings = relationship("SensorData", back_populates="device")
    ldr_readings = relationship("LDRReading", back_populates="device")
    outputs = relationship("DeviceOutput", back_populates="device")

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, ForeignKey("devices.device_id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    gas = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    distance = Column(Float, nullable=True)
    

    
    # Status: SAFE, WARNING, DANGER
    status = Column(String)

    device = relationship("Device", back_populates="readings")

class LDRReading(Base):
    __tablename__ = "ldr_readings"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, ForeignKey("devices.device_id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    digital_value = Column(Boolean) # 0 or 1
    analog_value = Column(Integer) # 0 to 1050

    device = relationship("Device", back_populates="ldr_readings")

class DeviceOutput(Base):
    __tablename__ = "device_outputs"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, ForeignKey("devices.device_id"))
    
    output_name = Column(String) # e.g. "Bulb 1"
    gpio_pin = Column(Integer) # For reference
    is_active = Column(Boolean, default=False)
    last_updated = Column(DateTime, default=datetime.utcnow)

    device = relationship("Device", back_populates="outputs")

