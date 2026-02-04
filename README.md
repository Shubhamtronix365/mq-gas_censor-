# Indianiiot - IoT Gas Monitoring System

Indianiiot is a comprehensive IoT solution designed for real-time monitoring of air quality and gas levels. It combines a robust hardware sensor network with a modern web dashboard to provide actionable insights into environmental conditions.

## 🚀 Features

- **Real-time Monitoring**: Live streaming of gas sensor data (MQ series) from ESP32 devices.
- **Interactive Dashboard**: Visualizes air quality metrics with dynamic charts and heatmaps.
- **Alert System**: Configurable alarms for hazardous gas levels.
- **Device Management**: Register and manage multiple sensor nodes.
- **Historical Data**: Store and analyze long-term environmental trends.

## 🛠️ Tech Stack

- **Hardware**: ESP32 microcontroller, MQ Gas Sensors
- **Frontend**: React, Vite, TailwindCSS, Recharts
- **Backend**: Python, FastAPI, SQLAlchemy
- **Database**: PostgreSQL (Production) / SQLite (Dev)

## 📂 Project Structure

- **`/client`**: React-based frontend application.
- **`/server`**: FastAPI backend server handling API requests and database operations.
- **`/firmware`**: C++ firmware for ESP32 devices (Arduino framework).

## ⚡ Quick Start

### Prerequisites
- Node.js & npm
- Python 3.8+
- PostgreSQL (optional for dev, required for prod)

### 1. Backend Setup
Navigate to the server directory and set up the Python environment:

```bash
cd server
python -m venv myenv
# Windows
.\myenv\Scripts\activate
# Linux/Mac
# source myenv/bin/activate

pip install -r requirements.txt
```

Run the server:
```bash
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`. API Docs at `http://localhost:8000/docs`.

### 2. Frontend Setup
Navigate to the client directory and install dependencies:

```bash
cd client
npm install
```

Start the development server:
```bash
npm run dev
```
The dashboard will be available at `http://localhost:5173`.

### 3. Hardware Setup
Flash the firmware located in `firmware/esp32_sensegrid` to your ESP32 device using the Arduino IDE or PlatformIO. Ensure your `wifi_config.h` (if applicable) or code credentials are updated.

## 📖 detailed Guides

- [Setup Guide](./SETUP_GUIDE.md) - Detailed database and environment configuration.
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Instructions for deploying to production.