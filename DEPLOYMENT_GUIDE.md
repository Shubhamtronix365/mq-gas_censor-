# Deployment Guide for TRONIX365 Indianiiot

This guide will help you deploy your full-stack IoT application to the cloud.

## 1. Database Setup (Neon PostgreSQL)

Since we are moving to the cloud, we need a cloud database. We will use **Neon** (Free Tier).

1.  Go to [Neon.tech](https://neon.tech) and Sign Up.
2.  Create a **New Project**.
3.  Copy the **Connection String** (It looks like `postgres://user:pass@ep-xyz.aws.neon.tech/neondb...`).
4.  **Save this string**, you will need it for the Backend.

---

## 2. Backend Deployment (Render)

We will host the Python FastAPI backend on **Render**.

1.  Push your code to **GitHub** (if you haven't already).
2.  Go to [Render.com](https://render.com) and Sign Up/Login.
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Configure the Service:**
    *   **Name:** `sensegrid-api` (or unique name)
    *   **Region:** Singapore (or nearest to you)
    *   **Branch:** `main`
    *   **Root Directory:** `.` (Leave empty)
    *   **Runtime:** `Python 3`
    *   **Build Command:** `pip install -r server/requirements.txt`
    *   **Start Command:** `uvicorn server.app.main:app --host 0.0.0.0 --port $PORT`
6.  **Environment Variables:** (Scroll down to "Advanced" or "Environment")
    *   Add `DATABASE_URL` = (Paste your Neon Connection String here)
    *   Add `SECRET_KEY` = (Generate a random string)
    *   Add `ALGORITHM` = `HS256`
    *   Add `ACCESS_TOKEN_EXPIRE_MINUTES` = `1440`
    *   Add `PYTHON_VERSION` = `3.11.0` (Optional, good for stability)
7.  Click **Create Web Service**.

**Wait for it to deploy.** Once finished, Render will give you a URL like:
`https://sensegrid-api.onrender.com`
**Copy this URL.**

---

## 3. Frontend Deployment (Cloudflare Pages)

Now we deploy the React Frontend to your domain `indianiiot.com`.

1.  **Update Frontend Code:**
    *   We have already updated your code to look for the API URL.
    *   You need to tell Cloudflare *what* that URL is.

2.  Go to [Cloudflare Dashboard](https://dash.cloudflare.com) -> **Workers & Pages**.
3.  Click **Create Application** -> **Pages** -> **Connect to Git**.
4.  Select your GitHub repository.
5.  **Build Settings:**
    *   **Framework Preset:** `Vite` (or React)
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
    *   **Root Directory:** `client` (Important! Because your frontend is in the `client` folder)
6.  **Environment Variables:**
    *   Add `VITE_API_URL` = `https://sensegrid-api.onrender.com` (The URL you got from Render)
7.  Click **Save and Deploy**.

**Custom Domain:**
1.  Once deployed, go to the **Custom Domains** tab in your Pages project.
2.  Add `indianiiot.com`.
3.  Cloudflare will automatically configure the DNS for you.

---

## 4. Final Hardware Update

Now that your Backend is live on the internet, your ESP32 needs to send data there instead of `192.168.x.x`.

1.  Open Arduino IDE.
2.  Update `serverUrl` in `esp32_sensegrid.ino`:
    ```cpp
    const char* serverUrl = "https://sensegrid-api.onrender.com/api/v1/ingest";
    ```
    *(Note: HTTPS might require `WiFiClientSecure`. For simple testing, Render supports HTTP, but HTTPS is better. If using HTTPS on ESP32, you might need the Root CA Certificate. For now, try standard HTTP or setup the Secure Client.)*

    **Simpler Start:** Render often redirects HTTP to HTTPS. If the ESP32 struggles with SSL, let's verify connection first.

3.  Upload code to ESP32.

---

**Summary of URLs:**
*   **Website:** `https://indianiiot.com`
*   **Backend API:** `https://sensegrid-api.onrender.com`
*   **Database:** Neon Cloud
