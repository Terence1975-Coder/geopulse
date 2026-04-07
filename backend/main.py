from pathlib import Path
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db import Base, engine
from backend.intel.router import router as intel_router
from backend.api.company_intelligence import router as company_router  # ✅ ADD

# Ensure DB tables exist
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(title="GeoPulse AI Backend")

# CORS for frontend (Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(intel_router)
app.include_router(company_router)  # ✅ CRITICAL FIX

# Health check
@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "geopulse-backend",
    }