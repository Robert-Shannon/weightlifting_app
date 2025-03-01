from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

# Base session schemas
class SessionBase(BaseModel):
    name: str
    notes: Optional[str] = None

class SessionCreate(SessionBase):
    template_ids: Optional[List[UUID]] = None

class SessionUpdate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None

class SessionComplete(BaseModel):
    completed_at: Optional[datetime] = None

# Session exercise schemas
class SessionExerciseCreate(BaseModel):
    exercise_id: UUID
    order: int
    notes: Optional[str] = None

class SessionExerciseUpdate(BaseModel):
    notes: Optional[str] = None

# Session set schemas
class SessionSetCreate(BaseModel):
    set_number: int
    reps_completed: int
    weight: Optional[float] = None
    is_warmup: Optional[bool] = False
    rpe: Optional[int] = None
    notes: Optional[str] = None

class SessionSetUpdate(BaseModel):
    reps_completed: Optional[int] = None
    weight: Optional[float] = None
    is_warmup: Optional[bool] = None
    rpe: Optional[int] = None
    notes: Optional[str] = None

class SessionSetRest(BaseModel):
    rest_start_time: Optional[datetime] = None
    rest_end_time: Optional[datetime] = None
    actual_rest_time: Optional[int] = None

# Response schemas
class SessionSetResponse(BaseModel):
    id: UUID
    set_number: int
    reps_completed: int
    weight: Optional[float] = None
    is_warmup: Optional[bool] = False
    rpe: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    set_duration: Optional[int] = None
    rest_start_time: Optional[datetime] = None
    rest_end_time: Optional[datetime] = None
    actual_rest_time: Optional[int] = None
    tempo: Optional[str] = None
    time_under_tension: Optional[int] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SessionExerciseResponse(BaseModel):
    id: UUID
    exercise_id: UUID
    order: int
    notes: Optional[str] = None
    superset_group_id: Optional[str] = None
    superset_order: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    active_duration: Optional[int] = None
    sets: List[SessionSetResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    exercise_name: Optional[str] = None
    target_muscle_group: Optional[str] = None
    
    class Config:
        from_attributes = True

class SessionResponse(SessionBase):
    id: UUID
    user_id: UUID
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    active_duration: Optional[int] = None
    total_rest_duration: Optional[int] = None
    exercises: List[SessionExerciseResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SessionListResponse(BaseModel):
    id: UUID
    name: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration: Optional[int] = None
    exercise_count: int
    
    class Config:
        from_attributes = True

# Superset schemas
class SupersetCreate(BaseModel):
    exercise_ids: List[UUID]
    orders: List[int]

# Updated to return exercise objects with attributes
class SupersetResponse(BaseModel):
    superset_group_id: str
    exercises: List[Dict[str, Any]]
    
    class Config:
        from_attributes = True