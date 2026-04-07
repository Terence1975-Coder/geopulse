from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import companies_house, company_profiles, intel, events, analysis, sources

app = FastAPI(
    title="GeoPulse AI",
    description="Geopolitical Business Intelligence Platform",
    version="5.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "GeoPulse AI V5 running",
        "status": "ok",
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

# Core V5 routers
app.include_router(companies_house.router)
app.include_router(company_profiles.router)
app.include_router(intel.router)

# Rebuilt core GeoPulse routers
app.include_router(events.router)
app.include_router(analysis.router)
app.include_router(sources.router)