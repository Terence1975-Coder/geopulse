from pathlib import Path
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db import Base, engine
from backend.intel.router import router as intel_router
from backend.api.company_intelligence import router as company_router

# Ensure DB tables exist
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(title="GeoPulse Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://geopulse-3u8t.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(intel_router)
app.include_router(company_router)

# Health check
@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "geopulse-backend",
    }
