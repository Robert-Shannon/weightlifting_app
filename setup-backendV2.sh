#!/bin/bash

# Script to set up the backend structure for the weightlifting tracking app
# Run this from the root of your repository

echo "Setting up weightlifting app backend structure..."

# Navigate to backend directory
cd backend

# Create the basic directory structure
mkdir -p src/models src/schemas src/repositories src/services src/api/v1 src/core src/utils tests

# Create __init__.py files in each directory to make them proper Python packages
find . -type d -not -path "./venv*" -not -path "./.git*" -exec touch {}/__init__.py \;

# Create core configuration files
mkdir -p src/core/config
cat > src/core/config/__init__.py << 'EOF'
from .settings import get_settings, Settings

__all__ = ["get_settings", "Settings"]
EOF

cat > src/core/config/settings.py << 'EOF'
import os
from functools import lru_cache
from typing import Optional, Dict, Any

from pydantic import PostgresDsn, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Weightlifting Tracker API"
    API_V1_STR: str = "/api/v1"
    
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "weightlifting_db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    def assemble_db_connection(cls, v: Optional[str], info) -> Any:
        if isinstance(v, str):
            return v
            
        # Extract values from the info object
        values = info.data
        
        # Convert port to integer for Pydantic v2
        port = values.get("POSTGRES_PORT")
        if port and isinstance(port, str):
            port = int(port)
            
        return PostgresDsn.build(
            scheme="postgresql",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=port,
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )

    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-for-development-only")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
EOF

# Create database connection module
mkdir -p src/core/database
cat > src/core/database/__init__.py << 'EOF'
from .session import engine, SessionLocal, Base

__all__ = ["engine", "SessionLocal", "Base"]
EOF

cat > src/core/database/session.py << 'EOF'
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from src.core.config import get_settings

settings = get_settings()

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
EOF

# Create basic models based on our database design
cat > src/models/user.py << 'EOF'
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID

from src.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
EOF

cat > src/models/exercise.py << 'EOF'
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID

from src.core.database import Base


class Exercise(Base):
    __tablename__ = "exercise"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    short = Column(String, nullable=True)
    youtube_demonstration = Column(String, nullable=True)
    in_depth_youtube_explanation = Column(String, nullable=True)
    difficulty_level = Column(String, nullable=True)
    target_muscle_group = Column(String, nullable=False, index=True)
    prime_mover_muscle = Column(String, nullable=True)
    secondary_muscle = Column(String, nullable=True)
    tertiary_muscle = Column(String, nullable=True)
    primary_equipment = Column(String, nullable=True)
    primary_items_count = Column(Integer, nullable=True)
    secondary_equipment = Column(String, nullable=True)
    secondary_items_count = Column(Integer, nullable=True)
    posture = Column(String, nullable=True)
    single_or_double_arm = Column(String, nullable=True)
    continuous_or_alternating_arms = Column(String, nullable=True)
    grip = Column(String, nullable=True)
    load_position_ending = Column(String, nullable=True)
    continuous_or_alternating_legs = Column(String, nullable=True)
    foot_elevation = Column(Boolean, default=False)
    combination_exercises = Column(Boolean, default=False)
    movement_pattern_1 = Column(String, nullable=True)
    movement_pattern_2 = Column(String, nullable=True)
    movement_pattern_3 = Column(String, nullable=True)
    plane_of_motion_1 = Column(String, nullable=True)
    plane_of_motion_2 = Column(String, nullable=True)
    plane_of_motion_3 = Column(String, nullable=True)
    body_region = Column(String, nullable=True)
    force_type = Column(String, nullable=True)
    mechanics = Column(String, nullable=True)
    laterality = Column(String, nullable=True)
    primary_exercise_classification = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
EOF

cat > src/models/workout.py << 'EOF'
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.core.database import Base


class WorkoutTemplate(Base):
    __tablename__ = "workout_template"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    exercises = relationship("WorkoutTemplateExercise", back_populates="template")


class WorkoutTemplateExercise(Base):
    __tablename__ = "workout_template_exercise"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workout_template_id = Column(UUID(as_uuid=True), ForeignKey("workout_template.id"), nullable=False)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercise.id"), nullable=False)
    order = Column(Integer, nullable=False)
    notes = Column(String, nullable=True)
    superset_group_id = Column(String, nullable=True)
    superset_order = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    template = relationship("WorkoutTemplate", back_populates="exercises")
    sets = relationship("WorkoutTemplateSet", back_populates="template_exercise")


class WorkoutTemplateSet(Base):
    __tablename__ = "workout_template_set"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workout_template_exercise_id = Column(UUID(as_uuid=True), ForeignKey("workout_template_exercise.id"), nullable=False)
    set_number = Column(Integer, nullable=False)
    target_reps = Column(Integer, nullable=False)
    target_weight = Column(Float, nullable=True)
    is_warmup = Column(Boolean, default=False)
    target_rest_time = Column(Integer, nullable=True)  # in seconds
    is_superset_last_exercise = Column(Boolean, default=False)
    tempo = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    template_exercise = relationship("WorkoutTemplateExercise", back_populates="sets")


class WorkoutSession(Base):
    __tablename__ = "workout_session"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    active_duration = Column(Integer, nullable=True)  # in seconds
    total_rest_duration = Column(Integer, nullable=True)  # in seconds
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    exercises = relationship("WorkoutSessionExercise", back_populates="session")
    templates = relationship("WorkoutSessionTemplate", back_populates="session")


class WorkoutSessionTemplate(Base):
    __tablename__ = "workout_session_template"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workout_session_id = Column(UUID(as_uuid=True), ForeignKey("workout_session.id"), nullable=False)
    workout_template_id = Column(UUID(as_uuid=True), ForeignKey("workout_template.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    session = relationship("WorkoutSession", back_populates="templates")


class WorkoutSessionExercise(Base):
    __tablename__ = "workout_session_exercise"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workout_session_id = Column(UUID(as_uuid=True), ForeignKey("workout_session.id"), nullable=False)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercise.id"), nullable=False)
    order = Column(Integer, nullable=False)
    workout_template_exercise_id = Column(UUID(as_uuid=True), ForeignKey("workout_template_exercise.id"), nullable=True)
    notes = Column(String, nullable=True)
    superset_group_id = Column(String, nullable=True)
    superset_order = Column(Integer, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    active_duration = Column(Integer, nullable=True)  # in seconds
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    session = relationship("WorkoutSession", back_populates="exercises")
    sets = relationship("WorkoutSet", back_populates="session_exercise")


class WorkoutSet(Base):
    __tablename__ = "workout_set"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workout_session_exercise_id = Column(UUID(as_uuid=True), ForeignKey("workout_session_exercise.id"), nullable=False)
    set_number = Column(Integer, nullable=False)
    reps_completed = Column(Integer, nullable=False)
    weight = Column(Float, nullable=True)
    is_warmup = Column(Boolean, default=False)
    rpe = Column(Integer, nullable=True)  # Rate of Perceived Exertion
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    set_duration = Column(Integer, nullable=True)  # in seconds
    rest_start_time = Column(DateTime, nullable=True)
    rest_end_time = Column(DateTime, nullable=True)
    actual_rest_time = Column(Integer, nullable=True)  # in seconds
    tempo = Column(String, nullable=True)
    time_under_tension = Column(Integer, nullable=True)  # in seconds
    workout_template_set_id = Column(UUID(as_uuid=True), ForeignKey("workout_template_set.id"), nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    session_exercise = relationship("WorkoutSessionExercise", back_populates="sets")


class WorkoutSessionMetrics(Base):
    __tablename__ = "workout_session_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workout_session_id = Column(UUID(as_uuid=True), ForeignKey("workout_session.id"), nullable=False)
    day_of_week = Column(Integer, nullable=True)  # 0-6 for Sunday-Saturday
    time_of_day = Column(String, nullable=True)  # "morning", "afternoon", "evening"
    start_hour = Column(Integer, nullable=True)  # 0-23
    total_volume = Column(Float, nullable=True)
    average_rest_between_sets = Column(Integer, nullable=True)  # in seconds
    total_sets_completed = Column(Integer, nullable=True)
    planned_vs_actual_duration_ratio = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
EOF

# Create a proper models/__init__.py file that explicitly imports all models
cat > src/models/__init__.py << 'EOF'
from .user import User
from .exercise import Exercise
from .workout import (
    WorkoutTemplate, 
    WorkoutTemplateExercise, 
    WorkoutTemplateSet,
    WorkoutSession,
    WorkoutSessionTemplate,
    WorkoutSessionExercise,
    WorkoutSet,
    WorkoutSessionMetrics
)

__all__ = [
    "User",
    "Exercise",
    "WorkoutTemplate",
    "WorkoutTemplateExercise",
    "WorkoutTemplateSet",
    "WorkoutSession",
    "WorkoutSessionTemplate",
    "WorkoutSessionExercise",
    "WorkoutSet",
    "WorkoutSessionMetrics"
]
EOF

# Create basic schemas
mkdir -p src/schemas
cat > src/schemas/user.py << 'EOF'
from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None


class UserInDBBase(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    password_hash: str
EOF

# Create main FastAPI app
cat > src/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.v1.api import api_router
from src.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {"message": "Welcome to the Weightlifting Tracker API"}
EOF

# Create API router
mkdir -p src/api/v1
cat > src/api/v1/api.py << 'EOF'
from fastapi import APIRouter

from src.api.v1.endpoints import users, exercises, templates, sessions

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(exercises.router, prefix="/exercises", tags=["exercises"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
EOF

# Create basic endpoint modules
mkdir -p src/api/v1/endpoints
cat > src/api/v1/endpoints/users.py << 'EOF'
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.core.database import get_db

router = APIRouter()


@router.get("/")
def read_users(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    return {"message": "List users endpoint"}


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(db: Session = Depends(get_db)):
    return {"message": "Create user endpoint"}


@router.get("/me")
def read_user_me(db: Session = Depends(get_db)):
    return {"message": "Current user info endpoint"}


@router.put("/me")
def update_user_me(db: Session = Depends(get_db)):
    return {"message": "Update current user endpoint"}
EOF

cat > src/api/v1/endpoints/exercises.py << 'EOF'
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.core.database import get_db

router = APIRouter()


@router.get("/")
def read_exercises(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    return {"message": "List exercises endpoint"}


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_exercise(db: Session = Depends(get_db)):
    return {"message": "Create exercise endpoint"}


@router.get("/{exercise_id}")
def read_exercise(exercise_id: str, db: Session = Depends(get_db)):
    return {"message": f"Get exercise {exercise_id} endpoint"}


@router.put("/{exercise_id}")
def update_exercise(exercise_id: str, db: Session = Depends(get_db)):
    return {"message": f"Update exercise {exercise_id} endpoint"}


@router.delete("/{exercise_id}")
def delete_exercise(exercise_id: str, db: Session = Depends(get_db)):
    return {"message": f"Delete exercise {exercise_id} endpoint"}


@router.post("/import")
def import_exercises(db: Session = Depends(get_db)):
    return {"message": "Import exercises from file endpoint"}
EOF

cat > src/api/v1/endpoints/templates.py << 'EOF'
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.core.database import get_db

router = APIRouter()


@router.get("/")
def read_templates(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    return {"message": "List templates endpoint"}


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_template(db: Session = Depends(get_db)):
    return {"message": "Create template endpoint"}


@router.get("/{template_id}")
def read_template(template_id: str, db: Session = Depends(get_db)):
    return {"message": f"Get template {template_id} endpoint"}


@router.put("/{template_id}")
def update_template(template_id: str, db: Session = Depends(get_db)):
    return {"message": f"Update template {template_id} endpoint"}


@router.delete("/{template_id}")
def delete_template(template_id: str, db: Session = Depends(get_db)):
    return {"message": f"Delete template {template_id} endpoint"}


@router.post("/{template_id}/exercises")
def add_exercise_to_template(template_id: str, db: Session = Depends(get_db)):
    return {"message": f"Add exercise to template {template_id} endpoint"}
EOF

cat > src/api/v1/endpoints/sessions.py << 'EOF'
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.core.database import get_db

router = APIRouter()


@router.get("/")
def read_sessions(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    return {"message": "List sessions endpoint"}


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_session(db: Session = Depends(get_db)):
    return {"message": "Create session endpoint"}


@router.get("/{session_id}")
def read_session(session_id: str, db: Session = Depends(get_db)):
    return {"message": f"Get session {session_id} endpoint"}


@router.put("/{session_id}")
def update_session(session_id: str, db: Session = Depends(get_db)):
    return {"message": f"Update session {session_id} endpoint"}


@router.post("/{session_id}/complete")
def complete_session(session_id: str, db: Session = Depends(get_db)):
    return {"message": f"Complete session {session_id} endpoint"}


@router.post("/{session_id}/exercises")
def add_exercise_to_session(session_id: str, db: Session = Depends(get_db)):
    return {"message": f"Add exercise to session {session_id} endpoint"}


@router.post("/{session_id}/exercises/{exercise_id}/sets")
def log_set(session_id: str, exercise_id: str, db: Session = Depends(get_db)):
    return {"message": f"Log set for exercise {exercise_id} in session {session_id} endpoint"}
EOF

# Create pyproject.toml - with uv instead of poetry
cat > pyproject.toml << 'EOF'
[build-system]
requires = ["setuptools>=42", "wheel"]
build-backend = "setuptools.build_meta"

[tool.black]
line-length = 88
target-version = ["py38", "py39", "py310"]

[tool.isort]
profile = "black"
multi_line_output = 3

[tool.mypy]
python_version = "3.10"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_functions = "test_*"
python_classes = "Test*"

[tool.pylint.messages_control]
disable = "C0111, C0103"
EOF

# Create requirements.txt
cat > requirements.txt << 'EOF'
fastapi>=0.104.1
uvicorn[standard]>=0.23.2
sqlalchemy>=2.0.23
pydantic[email]>=2.4.2
pydantic-settings>=2.0.3
alembic>=1.12.1
psycopg2-binary>=2.9.9
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6
pandas>=2.1.2
openpyxl>=3.1.2
pytest>=7.4.3
black>=23.10.1
isort>=5.12.0
mypy>=1.6.1
pylint>=3.0.2
EOF

# Set up alembic
mkdir -p migrations/versions
cat > alembic.ini << 'EOF'
# A generic, single database configuration.

[alembic]
# path to migration scripts
script_location = migrations

# template used to generate migration file names; The default value is %%(rev)s_%%(slug)s
# Uncomment the line below if you want the files to be prepended with date and time
# see https://alembic.sqlalchemy.org/en/latest/tutorial.html#editing-the-ini-file
# for all available tokens
# file_template = %%(year)d_%%(month).2d_%%(day).2d_%%(hour).2d%%(minute).2d-%%(rev)s_%%(slug)s

# sys.path path, will be prepended to sys.path if present.
# defaults to the current working directory.
prepend_sys_path = .

# timezone to use when rendering the date within the migration file
# as well as the filename.
# If specified, requires the python-dateutil library that can be
# installed by adding `alembic[tz]` to the pip requirements
# string value is passed to dateutil.tz.gettz()
# leave blank for localtime
# timezone =

# max length of characters to apply to the
# "slug" field
# truncate_slug_length = 40

# set to 'true' to run the environment during
# the 'revision' command, regardless of autogenerate
# revision_environment = false

# set to 'true' to allow .pyc and .pyo files without
# a source .py file to be detected as revisions in the
# versions/ directory
# sourceless = false

# version location specification; This defaults
# to migrations/versions.  When using multiple version
# directories, initial revisions must be specified with --version-path.
# The path separator used here should be the separator specified by "version_path_separator" below.
# version_locations = %(here)s/bar:%(here)s/bat:migrations/versions

# version path separator; As mentioned above, this is the character used to split
# version_locations. The default within new alembic.ini files is "os", which uses os.pathsep.
# If this key is omitted entirely, it falls back to the legacy behavior of splitting on spaces and/or commas.
# Valid values for version_path_separator are:
#
# version_path_separator = :
# version_path_separator = ;
# version_path_separator = space
version_path_separator = os  # Use os.pathsep. Default configuration used for new projects.

# the output encoding used when revision files
# are written from script.py.mako
# output_encoding = utf-8

sqlalchemy.url = postgresql://postgres:postgres@localhost/weightlifting_db


[post_write_hooks]
# post_write_hooks defines scripts or Python functions that are run
# on newly generated revision scripts.  See the documentation for further
# detail and examples

# format using "black" - use the console_scripts runner, against the "black" entrypoint
# hooks = black
# black.type = console_scripts
# black.entrypoint = black
# black.options = -l 79 REVISION_SCRIPT_FILENAME

# Logging configuration
[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
EOF

cat > migrations/env.py << 'EOF'
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context
from src.models import *  # Import all models
from src.core.database import Base
from src.core.config import get_settings

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

settings = get_settings()
config.set_main_option("sqlalchemy.url", str(settings.SQLALCHEMY_DATABASE_URI))

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
EOF