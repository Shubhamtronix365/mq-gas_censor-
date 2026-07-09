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

        # New Air Quality columns in sensor_data table
        columns_to_add = [
            ("co2", "DOUBLE PRECISION"),
            ("oxygen", "DOUBLE PRECISION"),
            ("voc", "INTEGER"),
            ("hcho", "DOUBLE PRECISION"),
            ("pressure", "DOUBLE PRECISION"),
            ("pm25", "DOUBLE PRECISION"),
            ("pm10", "DOUBLE PRECISION"),
            ("iaq", "INTEGER")
        ]

        for col_name, col_type in columns_to_add:
            print(f"Adding '{col_name}' column to sensor_data table...")
            try:
                connection.execute(text(f"ALTER TABLE sensor_data ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                print(f"Successfully added '{col_name}'.")
            except Exception as e:
                print(f"Error adding '{col_name}': {e}")
            
        connection.commit()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
