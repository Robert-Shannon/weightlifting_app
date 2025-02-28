import os
from functools import lru_cache
from typing import List, Optional, Any
from pydantic import PostgresDsn, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Weightlifting Tracker API"
    API_V1_STR: str = "/api/v1"
    
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "robertshannon")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    # Update default to match your psql connection output:
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "weightlifting_app")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    def assemble_db_connection(cls, v: Optional[str], info) -> Any:
        if isinstance(v, str):
            return v

        values = info.data
        # Convert port to integer for Pydantic v2 if needed.
        port = values.get("POSTGRES_PORT")
        if port and isinstance(port, str):
            port = int(port)

        return PostgresDsn.build(
            scheme="postgresql",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=port,
            path=f"{values.get('POSTGRES_DB') or ''}",
        )

    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-for-development-only")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALGORITHM: str = "HS256"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/weightlifting_app")

    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
    }

@lru_cache()
def get_settings() -> Settings:
    return Settings()


# Export a module-level settings variable for convenience.
settings = get_settings()
