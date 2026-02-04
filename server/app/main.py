from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, devices, data, users

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TRONIX365 Indianiiot")

# Configure CORS
origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:3000",
    "https://indianiiot.com",
    "https://www.indianiiot.com",
    "https://mq-gas-censor-sensegrid-api-tronix.onrender.com",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(devices.router)
app.include_router(data.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to TRONIX365 Indianiiot API"}
