import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "FarmWise Decision Engine"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Data & Database
    DATA_MODE: str = "synthetic_demo"
    DB_PATH: str = str(BASE_DIR / "app" / "data" / "farmwise.db")
    DEMO_FARM_FILE: str = str(BASE_DIR / "app" / "data" / "demo_farm.json")
    FEEDS_FILE: str = str(BASE_DIR / "app" / "data" / "feeds.json")

    # LLM & Voice Settings (Optional - fallback active if key is empty)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_AUDIO_MODEL: str = "whisper-large-v3"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    LLM_TIMEOUT_SECONDS: float = 12.0

    # Notification & SMS Gateway Settings (India / Demo / Provider-agnostic / Twilio)
    SMS_PROVIDER: str = "twilio"  # "demo", "msg91", "twilio"
    SMS_API_KEY: str = "3GDVLLVF9SGYGA2H447GJNNR"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = "3GDVLLVF9SGYGA2H447GJNNR"
    TWILIO_FROM_NUMBER: str = "+15005550006"
    SMS_SENDER_ID: str = "FARMWI"
    SMS_TEMPLATE_ID: str = ""
    SMS_DEFAULT_COUNTRY_CODE: str = "+91"
    SMS_COOLDOWN_HOURS: int = 6

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
