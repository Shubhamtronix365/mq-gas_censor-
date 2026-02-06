# 🌍 SenseGrid - Combined Gas & LDR Monitoring System

Welcome to the **SenseGrid** project! This is a comprehensive IoT Dashboard for monitoring Air Quality (Gas) and Lighting (LDR) in real-time.

This guide is designed to help new teammates set up the project from scratch on their local machines, even without internet access (Offline/LAN Mode).

---

## 📋 Prerequisites
Before starting, ensure you have the following installed:
1.  **Node.js** (v18+) -> [Download](https://nodejs.org/)
2.  **Python** (v3.10+) -> [Download](https://www.python.org/)
3.  **PostgreSQL** (v15+) -> [Download](https://www.postgresql.org/)
4.  **Arduino IDE** (for ESP32) -> [Download](https://www.arduino.cc/en/software)
5.  **Git** -> [Download](https://git-scm.com/)

---

## ⚙️ Step 1: Database Setup
We use PostgreSQL. You need to create a local database and user.

1.  Open **pgAdmin 4** (or standard SQL terminal).
2.  Create a user (Role):
    *   **Name:** `postgres` (or as configured in `.env`)
    *   **Password:** `Bhavesh729` (Important: Must match `.env`!)
    *   **Privileges:** Superuser (or Can Login + Create DB).
3.  Create a Database:
    *   **Name:** `sensegrid`
    *   **Owner:** `postgres`

---

## � Step 2: Backend Setup (Server)
The backend is built with **FastAPI**.

1.  Open a terminal in the root folder.
2.  Navigate to server:
    ```sh
    cd server --------------------------------------------------------
    ```
3.  (Optional but Recommended) Create a Virtual Environment:
    ```sh
    python -m venv myenv
    myenv\Scripts\activate
    ```
4.  Install Dependencies:
    ```sh
    pip install -r requirements.txt -------------------------------
    ```
5.  **Configure Environment**:
    *   Open `server/.env`.
    *   Ensure `DATABASE_URL` points to your local DB:
        ```ini
        DATABASE_URL=postgresql://postgres:Bhavesh729@localhost:5432/sensegrid
        ```
6.  **Run the Server**:
    ```sh
    # NOTE: Run this from the 'server' directory!
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```
    *Build Output: `Application startup complete.`*

---

## 🎨 Step 3: Frontend Setup (Client)
The frontend is built with **React + Vite**.

1.  Open a **NEW** terminal.
2.  Navigate to client:
    ```sh
    cd client --------------------------------------------------------
    ```
3.  Install Dependencies:
    ```sh
    npm install
    ```
4.  **Network Configuration (Crucial for LAN Access)**:
    *   Find your computer's Local IP Address:
        *   Windows: Run `ipconfig` in CMD (Look for `IPv4 Address`, e.g., `192.168.1.7`).
    *   Open `client/.env`:
        *   Update `VITE_API_URL` to match your IP:
            ```ini
            VITE_API_URL=http://192.168.1.7:8000
            ```
5.  **Run the Client**:
    ```sh
    npm run dev -- --host --------------------------------------------
    ```
    *Terminal will show: `Network: http://192.168.1.7:5173`*

---

## �️ Step 4: Connectivity (Firewall Rules)
**IMPORTANT:** If you want to access this from your phone or another laptop, you **MUST** allow the ports through the Windows Firewall.

Run **Powershell as Administrator** and execute:
```powershell
netsh advfirewall firewall add rule name="Allow SenseGrid Backend" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="Allow SenseGrid Frontend" dir=in action=allow protocol=TCP localport=5173
```

---

## � Step 5: Hardware Setup (ESP32)
1.  Open `firmware/esp32_combined/esp32_combined.ino` in Arduino IDE.
2.  Install Required Libraries (Sketch -> Include Library -> Manage Libraries):
    *   `WiFi` (Standard)
    *   `HTTPClient` (Standard)
    *   `ArduinoJson` by Benoit Blanchon
    *   `NewPing` (for Ultrasonic)
3.  **Update Configuration in Code**:
    *   `ssid`: Your WiFi Name.
    *   `password`: Your WiFi Password.
    *   `apiBase`: **MUST** match your computer's IP:
        ```cpp
        const char* apiBase = "http://192.168.1.7:8000/api/v1"; 
        ```
4.  Upload to ESP32.

---

## ❓ Troubleshooting
*   **"Module not found: main"**: Make sure you run `uvicorn app.main:app`, NOT `uvicorn main:app`.
*   **Phone can't connect**:
    *   Are you on the same WiFi?
    *   Did you run the Firewall commands?
    *   Is the IP address correct? (Check `ipconfig` again, it changes sometimes!).
*   **Database Error**: Check if PostgreSQL service is running and password in `.env` matches.

---

### 🚀 Usage
Once everything is running:
*   **Dashboard**: `http://192.168.1.7:5173` (Open on any device on the network)
*   **API Docs**: `http://localhost:8000/docs`