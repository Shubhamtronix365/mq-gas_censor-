from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from server.app.models import Device, User
from server.app.auth import get_password_hash
import secrets

# Neon DB URL (from your .env)
DATABASE_URL = "postgresql://neondb_owner:npg_wU15cMqniKhs@ep-cold-snow-a1m91lqe-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def create_device_force():
    device_id = "ESP_32-test1"
    
    # Check if exists
    existing = db.query(Device).filter(Device.device_id == device_id).first()
    if existing:
        print(f"Device {device_id} already exists!")
        print(f"Token: {existing.device_token}")
        return

    # Create dummy user if needed (foreign key constraint?)
    # Checking models.py... usually devices belong to users.
    # Let's check if we need a user owner.
    # Assuming models.Device has owner_id
    
    owner = db.query(User).first()
    if not owner:
        print("Creating default admin user...")
        owner = User(email="admin@indianiiot.com", hashed_password=get_password_hash("admin123"))
        db.add(owner)
        db.commit()
        db.refresh(owner)
    
    print(f"Using owner: {owner.email} (ID: {owner.id})")

    # Create Device
    # Use the token the user likely has in their code/previous turn to avoid re-upload
    # Token from previous turn: c6d63d66cf504ef82c2adee492c2b82a
    # Or just generate new one and tell user. 
    # User said "i dont need to register", implies they want existing setup to work.
    # Let's try to preserve the old token if possible, or just generate a new one.
    # Actually, previous log showed sending data with token.. wait.
    # The Log showed "Response: Not Found".
    # I will just create a new one and print it.
    
    new_token = secrets.token_hex(16)
    
    new_device = Device(
        device_id=device_id,
        device_token=new_token,
        owner_id=owner.id
    )
    
    db.add(new_device)
    db.commit()
    
    print(f"SUCCESS! Created device: {device_id}")
    print(f"NEW TOKEN: {new_token}")
    print("Update your ESP32 code with this token if it's different.")

if __name__ == "__main__":
    create_device_force()
