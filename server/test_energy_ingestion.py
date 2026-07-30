import sys
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Import app modules
from app.main import app
from app.database import SessionLocal, get_db
from app import models

client = TestClient(app)

def test_energy_ingestion_flow():
    db: Session = SessionLocal()
    try:
        print("1. Preparing mock user and energy device in DB...")
        
        # Get or create test user
        test_user = db.query(models.User).filter(models.User.email == "energy_test@indianiiot.com").first()
        if not test_user:
            test_user = models.User(
                email="energy_test@indianiiot.com",
                hashed_password="mockpasswordhash",
                full_name="Energy Tester"
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"Created mock user with ID: {test_user.id}")
        else:
            print(f"Found existing mock user with ID: {test_user.id}")

        # Get or create test energy meter device
        device_id = "MOCK_ENERGY_METER"
        device_token = "mock_energy_token_999"
        
        device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
        if not device:
            device = models.Device(
                device_id=device_id,
                owner_id=test_user.id,
                device_token=device_token,
                device_type="energy_meter"
            )
            db.add(device)
            db.commit()
            db.refresh(device)
            print(f"Registered device: {device_id}")
        else:
            # Ensure type is correct
            device.device_type = "energy_meter"
            device.device_token = device_token
            db.commit()
            print(f"Found existing device: {device_id}")

        print("\n2. Testing /api/v1/ingest POST route using TestClient...")
        
        payload = {
            "device_id": device_id,
            "kwh": 104859.712,
            "gas": 18.45  # Sending simulated kW load in the 'gas' field as a fallback metric
        }
        
        headers = {
            "Device-Token": device_token
        }
        
        response = client.post("/api/v1/ingest", json=payload, headers=headers)
        
        print(f"HTTP Response Code: {response.status_code}")
        print(f"Response Payload: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify it was saved in the database
        print("\n3. Verifying reading in the database...")
        latest_reading = db.query(models.SensorData)\
            .filter(models.SensorData.device_id == device_id)\
            .order_by(models.SensorData.timestamp.desc())\
            .first()
            
        assert latest_reading is not None, "No reading found in database!"
        print(f"DB Row - ID: {latest_reading.id}, Timestamp: {latest_reading.timestamp}, kWh: {latest_reading.kwh}, Gas (kW): {latest_reading.gas}, Status: {latest_reading.status}")
        assert abs(latest_reading.kwh - 104859.712) < 0.001, f"Expected kWh 104859.712, found {latest_reading.kwh}"
        
        print("\nSUCCESS: Energy ingestion pipeline verified end-to-end!")
        
    except Exception as e:
        print(f"\nFAILED: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    test_energy_ingestion_flow()
