from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.seed import seed_database
from app.api.routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure SQLite database schema exists and demo data is seeded
    seed_database(force=False)
    yield
    # Shutdown logic if needed

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "FarmWise Multi-Agent Decision-Support Platform for Dairy Farms. "
        "Your experience. More evidence. Better farm decisions."
    ),
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

@app.get("/")
def read_root():
    return {
        "app": settings.APP_NAME,
        "tagline": "Your experience. More evidence. Better farm decisions.",
        "version": settings.APP_VERSION,
        "data_mode": settings.DATA_MODE,
        "documentation": "/docs",
        "api_health": "/api/health",
        "api_dashboard": "/api/dashboard",
        "api_feeds": "/api/feeds"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
