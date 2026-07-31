import os
import time
from collections import defaultdict
from threading import Lock
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from .database import engine, Base, SessionLocal
from .routers import auth, devices, data, users, ldr, payment, jobs

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TRONIX365 Indianiiot")

def run_daily_expiry_check():
    """Background cron job that checks for expiring subscriptions daily."""
    from .utils import email as email_utils
    from . import models
    from datetime import datetime, timezone
    
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        users_list = db.query(models.User).filter(
            models.User.subscription_plan != "free",
            models.User.subscription_plan != "none",
            models.User.subscription_expiry.isnot(None)
        ).all()
        
        for user in users_list:
            expiry = user.subscription_expiry
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)
            days_left = (expiry - now).days
            
            if days_left == 7:
                expiry_str = expiry.strftime("%Y-%m-%d")
                email_utils.send_subscription_expiry_warning_email(
                    user_email=user.email,
                    full_name=user.full_name or "IoT Administrator",
                    plan_name=user.subscription_plan,
                    expiry_date_str=expiry_str,
                    days_left=7
                )
                print(f"EXPIRY ALERT: Sent 7-day warning to {user.email}")
    finally:
        db.close()

# APScheduler for daily background cron jobs
scheduler = BackgroundScheduler()
scheduler.add_job(run_daily_expiry_check, "cron", hour=0, minute=0)

@app.on_event("startup")
def startup_event():
    scheduler.start()
    print("APScheduler started — daily subscription expiry checker running at midnight UTC.")

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()
    print("APScheduler shut down cleanly.")

# Sliding Window In-Memory Rate Limiter Middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 30, window: int = 60):
        super().__init__(app)
        self.limit = limit  # Max 30 requests
        self.window = window  # Per 60 seconds
        self.requests = defaultdict(list)
        self.lock = Lock()
        
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        # Limit rate on auth and edge sensor ingestion routes (do not throttle dashboard read polling)
        is_throttled = any(p in path for p in ["/auth/login", "/auth/register", "/auth/google", "/api/v1/ingest"])
        
        if is_throttled:
            # Use proxy forwarded header if behind reverse proxy, else fallback to standard client host
            ip = request.headers.get("X-Forwarded-For", request.client.host)
            now = time.time()
            
            with self.lock:
                # Remove timestamps older than the sliding window
                self.requests[ip] = [t for t in self.requests[ip] if now - t < self.window]
                
                if len(self.requests[ip]) >= self.limit:
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Too many authentication/ingestion requests. Please wait a minute before retrying."}
                    )
                
                self.requests[ip].append(now)
                
        return await call_next(request)

# Add Rate Limiter Middleware
app.add_middleware(RateLimitMiddleware, limit=30, window=60)

# Configure CORS dynamically for local & hosted deployment environments
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
custom_origins = []
if allowed_origins_str:
    custom_origins = [org.strip().rstrip("/") for org in allowed_origins_str.split(",") if org.strip()]

default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://localhost:8000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4173",
    "http://127.0.0.1:8000",
    "http://192.168.1.7:5173",
    "https://indianiiot.com",
    "https://www.indianiiot.com",
    "https://mq-gas-censor-tronix.pages.dev",
    "https://mq-gas-censor-sensegrid-api-tronix.onrender.com",
]

# Combine and deduplicate origins without trailing slashes
origins = list(set(default_origins + custom_origins))

# Regex matching local dev ports and production deployment domains
origin_regex = r"https?://(localhost|127\.0\.0\.1|.*\.pages\.dev|.*\.onrender\.com|indianiiot\.com|www\.indianiiot\.com)(:\d+)?"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(devices.router)
app.include_router(data.router)
app.include_router(ldr.router)
app.include_router(payment.router)
app.include_router(jobs.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to TRONIX365 Indianiiot API"}
