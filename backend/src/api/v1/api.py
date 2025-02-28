from fastapi import APIRouter

from src.api.v1.endpoints import users, exercises, templates, sessions, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(exercises.router, prefix="/exercises", tags=["exercises"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
