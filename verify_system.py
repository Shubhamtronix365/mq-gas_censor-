import requests
import time
import random

BASE_URL = "http://localhost:8000"

def simulate_esp32(device_id, device_token):
    print(f"Simulating ESP32 for {device_id}...")
    headers = {"Device-Token": device_token}
    
    print("Sending data... (Press Ctrl+C to stop)")
    # Run for 60 seconds
    for i in range(60):
        data = {
            "device_id": device_id,
            "gas": random.uniform(200, 1200),
            "temperature": random.uniform(20, 45),
            "humidity": random.uniform(30, 80),
            "distance": random.uniform(10, 100),
            "co2": random.uniform(400, 2000),
            "oxygen": random.uniform(19.5, 20.9),
            "voc": random.randint(10, 400),
            "hcho": random.uniform(0.005, 0.5),
            "pressure": random.uniform(950.0, 1050.0),
            "pm2.5": random.uniform(5.0, 150.0),
            "pm10": random.uniform(10.0, 250.0),
            "iaq": random.randint(10, 450)
        }
        
        try:
            resp = requests.post(f"{BASE_URL}/api/v1/ingest", json=data, headers=headers)
            print(f"[{i+1}/60] Sent: Temp={data['temperature']:.1f}C PM2.5={data['pm2.5']:.1f} IAQ={data['iaq']} -> Status: {resp.status_code}")
        except Exception as e:
            print(f"Ingest failed: {e}")
        
        time.sleep(1)

if __name__ == "__main__":
    # USER PROVIDED CREDENTIALS
    DEVICE_ID = "ESP-test1"
    DEVICE_TOKEN = "c6d63d66cf504ef82c2adee492c2b82a"
    
    simulate_esp32(DEVICE_ID, DEVICE_TOKEN)
