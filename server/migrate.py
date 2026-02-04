from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def migrate():
    print(f"Connecting to database...")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as connection:
        print("Adding 'full_name' column to users table...")
        try:
            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR"))
            print("Successfully added 'full_name'.")
        except Exception as e:
            print(f"Error adding 'full_name': {e}")

        print("Adding 'phone_number' column to users table...")
        try:
            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR"))
            print("Successfully added 'phone_number'.")
        except Exception as e:
            print(f"Error adding 'phone_number': {e}")

        print("Adding 'device_type' column to devices table...")
        try:
            connection.execute(text("ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_type VARCHAR DEFAULT 'gas_sensor'"))
            print("Successfully added 'device_type'.")
        except Exception as e:
            print(f"Error adding 'device_type': {e}")
            
        connection.commit()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
