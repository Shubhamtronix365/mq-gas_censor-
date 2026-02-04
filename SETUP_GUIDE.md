# TRONIX365 Indianiiot - Database Setup Guide

This project is configured to use **PostgreSQL** as the production database. 
*Note: For immediate testing, the app is currently running in "SQLite Mode" so you can see it working without this setup.*

## 1. Install PostgreSQL
1. Download the installer for Windows from: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Run the installer.
3. **Important**: When asked for a password for the superuser (`postgres`), remember it! The default in our code is `password`. If you choose something else, you must update `.env` or `database.py`.
4. Keep the default port `5432`.

## 2. Install & Open pgAdmin 4
(This usually comes bundled with the PostgreSQL installer)
1. Open **pgAdmin 4** from your Start menu.
2. It might ask for a "Master Password" to secure your saved passwords. Set one you can remember.
3. In the left sidebar, click on **Servers** -> **PostgreSQL**. You may need to enter the password you set in Step 1.

## 3. Create the Database
1. Right-click on **Databases** -> **Create** -> **Database...**
2. Name the database: `sensegrid`
3. Click **Save**.

## 4. Connect the App
Once you have installed Postgres and created the `sensegrid` database:
1. Open `server/app/database.py`.
2. Uncomment the PostgreSQL line and update the password if yours is different from `password`:
   ```python
   SQLALCHEMY_DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@localhost/sensegrid"
   ```
3. Comment out the SQLite line.
4. Restart the backend server.
