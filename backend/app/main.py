"""FarmWise FastAPI Application Entrypoint."""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.routes import router
from app.db.database import init_db

# Load .env if present
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize SQLite database and demo services on application startup."""
    init_db()
    yield


app = FastAPI(
    title="FarmWise Decision Support Engine",
    description="Multi-agent decision-support platform for dairy farms. Your experience. More evidence. Better farm decisions.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS setup for frontend development
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(router)


@app.get("/", tags=["Root"])
def root():
    return {
        "project": "FarmWise",
        "tagline": "Your experience. More evidence. Better farm decisions.",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "dashboard": "/api/dashboard",
    }


if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
