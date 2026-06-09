from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api import auth, cars, service_requests, admin
from app.routers import payments
from app.models import models

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Car Service Management System (CSMS) API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cars.router)
app.include_router(service_requests.router)
app.include_router(admin.router)
app.include_router(payments.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to CSMS API"}