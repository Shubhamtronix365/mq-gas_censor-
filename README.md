# 🌍 SenseGrid - Combined Gas & LDR Monitoring System

Welcome to the **SenseGrid** (TRONIX365 Indianiiot) project! This is a comprehensive, production-ready, full-stack IoT platform for real-time environmental telemetry monitoring and automated appliance control.

SenseGrid enables real-time sensing of air quality (Gas level), temperature, humidity, and safety proximity, coupled with dynamic ambient light detection (LDR) and remote manual override controllers for electrical appliances (relays/GPIO pins).

---

## 🗺️ System Architecture

Below is the high-level architecture diagram detailing the hardware interactions, connectivity protocols, backend services, database schemas, and frontend presentation modules.

![SenseGrid System Architecture](ChatGPT%20Image%20Jun%2017%2C%202026%2C%2002_39_51%20PM.png)

---

## 📄 Description

SenseGrid solves the challenge of scattered environmental data and disconnected automation systems by merging edge sensor collection with a modern web control deck. The ESP32 edge microcontroller reads analog and digital sensors, performs zero-latency local loops (for fast physical lighting adjustments), and pushes telemetry data via HTTP REST calls to a FastAPI backend. A responsive React web app polls the server to present interactive Recharts area graphs, current hazard state alerts, and toggles that let users remotely actuate physical switches.

---

## ⚡ Features

### 1. User Management & Authentication
*   **Secure Sign Up/Login**: JWT (JSON Web Token) authentication flow powered by OAuth2.
*   **Password Hashing**: Implements salted bcrypt hashing to ensure data security.
*   **User Preferences Syncing**: Stores individual configuration settings (e.g., dashboard card custom icons) directly in PostgreSQL as JSON payloads.

### 2. Device Registration & Verification
*   **Device Onboarding**: Dynamic registration form to onboard new hardware units.
*   **Secure API Tokens**: Auto-generates a unique security token (`secrets.token_hex(16)`) for each device, passed via the HTTP headers (`Device-Token`) to prevent device spoofing.
*   **Cascading Deletes**: Deleting a device triggers database hooks that purge all associated historical readings and configurations.

### 3. Gas & Proximity Monitoring (GasDashboard)
*   **Telemetry tracking**: Polls air quality (ppm), temperature (°C), humidity (%), and safety distance (cm) every 5 seconds.
*   **Server-Side Hazard Assessment**:
    *   `DANGER`: Triggered if gas level > 1000 ppm OR ultrasonic proximity < 20 cm.
    *   `WARNING`: Triggered if gas level > 500 ppm OR temperature > 40°C.
    *   `SAFE`: Nominal ranges.
*   **Visual Status Indicators**: Glowing bento grids change color adaptively.
*   **Custom Sensor Icons**: Interactive panel lets users change card icons on the fly using a slide-out Lucide icon picker.

### 4. Smart Light Automation (LDRDashboard)
*   **Ambient Light Ingestion**: 1-second interval tracking for digital light status and 12-bit analog illumination intensity.
*   **AutoBulb Visualizer**: Interactive UI widget reflecting live brightness values.
*   **Relay Control Deck**: Configurable manual switches to actuate home appliances connected to ESP32 GPIO pins.

### 5. Unified Control Deck (UnifiedDashboard)
*   **Bento-Grid Correlation**: Renders overlapping Recharts area graphs displaying the correlation of air quality against light levels.
*   **Full Command Deck**: Combines all environment parameters and switches on a single unified screen.

### 6. Hardware Firmware (ESP32)
*   **Offline Zero-Latency Loop**: Directly maps LDR values to PWM dimming for local LEDs, remaining operational even during network failures.
*   **Polled Command Execution**: Microcontroller queries the server every 1 second to fetch relay states and triggers standard GPIO outputs (`digitalWrite`).
*   **Firmware Interlocks**: Restricts command execution to protect critical sensor pins from accidental write instructions.

---

## 🛠️ Tech Stack

*   **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, Recharts, Axios, React Router Dom.
*   **Backend**: FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic, Python-Jose (JWT), Passlib (bcrypt).
*   **Database**: PostgreSQL (Neon Cloud Serverless in production) with SQLite fallback for local developer setups.
*   **Hardware Core**: ESP32 microcontroller, MQ135 Air Quality Sensor, HC-SR04 Proximity Sensor, Analog Light Dependent Resistor (LDR), Smart Relays.

---

## 📁 Folder Structure

```text
project-root/
│
├── client/                      # React Frontend Source Code
│   ├── public/                  # Public static assets
│   ├── src/
│   │   ├── assets/              # Stylings, fonts, and images
│   │   ├── components/          # Reusable UI widgets (AutoBulb, Onboarding, Cards)
│   │   ├── context/             # React Context providers (Auth States)
│   │   ├── layouts/             # Shared dashboard layout wrappers
│   │   └── pages/               # Main pages (Dashboard, Login, Register, Profile)
│   ├── package.json             # NPM dependencies & build scripts
│   └── vite.config.js           # Vite development server settings
│
├── server/                      # FastAPI Backend Source Code
│   ├── app/
│   │   ├── routers/             # API Router endpoints (auth, data, devices, ldr, users)
│   │   ├── auth.py              # JWT token and crypt logic
│   │   ├── database.py          # SQLAlchemy Session setup
│   │   ├── main.py              # FastAPI initialization & CORS config
│   │   ├── models.py            # SQLAlchemy database tables
│   │   └── schemas.py           # Pydantic data schemas
│   ├── requirements.txt         # Pip package definitions
│   └── myenv/                   # Local Python Virtual Environment (git-ignored)
│
├── firmware/                    # Arduino ESP32 Source sketches
│   ├── esp32_combined/          # Unified firmware sketch (Combined Telemetry + Outputs)
│   ├── esp32_ldr/               # Dedicated LDR sketch
│   └── esp32_sensegrid/         # Dedicated Air Quality sketch
│
├── .gitignore                   # Ignore node_modules, myenv, and credentials
└── README.md                    # Core project documentation
```

---

## ⚙️ Setup Instructions

### 1. Database Setup
We use PostgreSQL in production and local SQLite for testing.

1.  **Local Postgres Configuration**:
    *   Create a database owner role named `postgres` with password `Bhavesh729` (configurable in `.env`).
    *   Create a database named `sensegrid`.
2.  **App Database Connection**:
    *   Configure database URL in `server/.env`.
    *   To test without Postgres, the app automatically falls back to a local `sensegrid.db` file (SQLite).

### 2. Backend Setup
1.  Navigate to the server directory:
    ```sh
    cd server
    ```
2.  Create and activate a Python virtual environment:
    ```sh
    python -m venv myenv
    # Windows
    myenv\Scripts\activate
    # Linux / macOS
    source myenv/bin/activate
    ```
3.  Install dependencies:
    ```sh
    pip install -r requirements.txt
    ```
4.  Configure environment variables in `server/.env` (see section below).

### 3. Frontend Setup
1.  Navigate to the client directory:
    ```sh
    cd ../client
    ```
2.  Install packages:
    ```sh
    npm install
    ```
3.  Configure `client/.env` (updating `VITE_API_URL` to match your local/remote server address).

### 4. ESP32 Hardware setup
1.  Open Arduino IDE and load `firmware/esp32_combined/esp32_combined.ino`.
2.  Install dependencies in Library Manager:
    *   `ArduinoJson` (v6+)
    *   `NewPing` (for Ultrasonic)
3.  Update the Wi-Fi credentials (`ssid`, `password`), server API URL (`apiBase`), and your unique device credentials (`deviceId`, `deviceToken`).
4.  Compile and upload code to ESP32.

---

## 🚀 Run Commands

### Development Mode

#### Running the Backend
From the `server` directory:
```sh
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*   API Docs will be accessible at: `http://localhost:8000/docs`

#### Running the Frontend
From the `client` directory:
```sh
npm run dev -- --host
```
*   Vite Dashboard will launch at: `http://localhost:5173`

---

## 📦 Installed Libraries

### Backend (Python Packages)
*   `fastapi` - Web API Framework.
*   `uvicorn` - High-performance ASGI Web Server.
*   `sqlalchemy` - Database Object Relational Mapping (ORM).
*   `psycopg2-binary` - PostgreSQL Database adapter.
*   `pydantic` - Data modeling and validation.
*   `python-jose[cryptography]` - JWT token creation and signing.
*   `passlib[bcrypt]` - Salting and hashing credentials.
*   `python-dotenv` - Loading variables from `.env`.

### Frontend (NPM Packages)
*   `axios` -> Handles API calls to backend routers.
*   `react-router-dom` -> Controls application routing and route guards.
*   `recharts` -> Telemetry data plotting.
*   `framer-motion` -> Micro-animations and page transitions.
*   `lucide-react` -> Icon sets for components.
*   `tailwindcss` -> Bento styling.

---

## 🔒 Environment Variables

Create `.env` files matching the configuration variables below.

### Server Config (`server/.env`)
```ini
DATABASE_URL=postgresql://postgres:Bhavesh729@localhost:5432/sensegrid
SECRET_KEY=your_super_secret_jwt_passphrase_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Client Config (`client/.env`)
```ini
VITE_API_URL=http://localhost:8000
```

---

## 🔌 API Details

| Endpoint | Method | Header/Parameters | Description |
| :--- | :---: | :--- | :--- |
| `/auth/register` | `POST` | JSON Body | Register a new user account |
| `/auth/login` | `POST` | Form Data | Login to get JWT Token |
| `/api/v1/users/me` | `GET` | `Bearer Token` | Fetch current logged-in user profile |
| `/api/v1/users/me` | `PUT` | `Bearer Token` / JSON | Update user profile and preferences |
| `/api/v1/devices` | `GET` | `Bearer Token` | List all registered devices for the user |
| `/api/v1/devices` | `POST` | `Bearer Token` / JSON | Register a new device (Gives API Token) |
| `/api/v1/devices/{id}` | `DELETE`| `Bearer Token` | Cascading delete a device and all readings |
| `/api/v1/ingest` | `POST` | `Device-Token` | Ingest MQ135 + Proximity telemetry data |
| `/api/v1/ldr/{id}/readings` | `POST` | `Device-Token` | Ingest analog and digital LDR light readings |
| `/api/v1/ldr/{id}/outputs` | `GET` | `Device-Token` | Poll current switch outputs for ESP32 GPIOs |
| `/api/v1/ldr/outputs/{id}` | `PUT` | `Bearer Token` / JSON | Toggle manual active relay state |

---

## 🔮 Future Scope

1.  **Caching Optimization (Redis)**: Integrate Redis caching to store live session counts, telemetry counters, and speed up active sensor data requests.
2.  **External Alarm Integrations**: Implement automated alarm integrations via SMTP emails or SMS/WhatsApp APIs (Twilio) to alert facility managers immediately when hazard levels reach a `DANGER` threshold.
3.  **Predictive Analytics**: Incorporate light and gas sensor history into machine learning models to forecast peak energy usage times or predict hazardous gas build-ups before they reach warning levels.