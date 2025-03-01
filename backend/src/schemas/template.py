from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

# Base template schemas
class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# Template exercise schemas
class TemplateExerciseBase(BaseModel):
    exercise_id: UUID
    order: int
    notes: Optional[str] = None

class TemplateExerciseCreate(TemplateExerciseBase):
    pass

class TemplateExerciseUpdate(BaseModel):
    order: Optional[int] = None
    notes: Optional[str] = None
    superset_group_id: Optional[str] = None
    superset_order: Optional[int] = None

# Template set schemas
class TemplateSetBase(BaseModel):
    set_number: int
    target_reps: int
    target_weight: Optional[float] = None
    is_warmup: Optional[bool] = False
    target_rest_time: Optional[int] = None
    tempo: Optional[str] = None

class TemplateSetCreate(TemplateSetBase):
    pass

class TemplateSetUpdate(BaseModel):
    target_reps: Optional[int] = None
    target_weight: Optional[float] = None
    is_warmup: Optional[bool] = None
    target_rest_time: Optional[int] = None
    tempo: Optional[str] = None

# Response schemas
class TemplateSetResponse(TemplateSetBase):
    id: UUID
    is_superset_last_exercise: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = {
        "from_attributes": True
    }

class TemplateExerciseResponse(TemplateExerciseBase):
    id: UUID
    superset_group_id: Optional[str] = None
    superset_order: Optional[int] = None
    sets: List[TemplateSetResponse] = []
    exercise_name: Optional[str] = None
    target_muscle_group: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = {
        "from_attributes": True
    }

class TemplateResponse(TemplateBase):
    id: UUID
    user_id: UUID
    exercises: List[TemplateExerciseResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = {
        "from_attributes": True
    }

class TemplateListResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    exercise_count: int
    
    model_config = {
        "from_attributes": True
    }

# Superset schemas
class TemplateSuperset(BaseModel):
    exercise_ids: List[UUID]
    orders: List[int]

class SupersetResponse(BaseModel):
    superset_group_id: str
    exercises: List[Dict[str, Any]]
    
    model_config = {
        "from_attributes": True
    }