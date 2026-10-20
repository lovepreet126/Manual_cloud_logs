from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.session_router import router as session_router
from app.routers.activities_router import router as activities_router
from app.routers.logs_router import router as logs_router

app = FastAPI(
    title="Cloud Manual Activity & Security Log Generator",
    description="Interactive Manual Cloud Activity Simulator generating realistic AWS CloudTrail, Azure Activity, and GCP Audit logs with progressive privilege unlocking.",
    version="1.0.0",
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(session_router)
app.include_router(activities_router)
app.include_router(logs_router)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Cloud Manual Activity & Security Log Generator API",
        "version": "1.0.0",
        "supported_clouds": ["aws", "azure", "gcp"],
        "endpoints": {
            "session": "/api/session",
            "activities": "/api/activities",
            "logs": "/api/logs",
            "docs": "/docs",
        },
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "cloud-manual-logs-backend"}
