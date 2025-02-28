from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class ExerciseBase(BaseModel):
    name: str
    target_muscle_group: str
    short: Optional[str] = None
    youtube_demonstration: Optional[str] = None
    in_depth_youtube_explanation: Optional[str] = None
    difficulty_level: Optional[str] = None
    prime_mover_muscle: Optional[str] = None
    secondary_muscle: Optional[str] = None
    tertiary_muscle: Optional[str] = None
    primary_equipment: Optional[str] = None
    primary_items_count: Optional[int] = None
    secondary_equipment: Optional[str] = None
    secondary_items_count: Optional[int] = None
    posture: Optional[str] = None
    single_or_double_arm: Optional[str] = None
    continuous_or_alternating_arms: Optional[str] = None
    grip: Optional[str] = None
    load_position_ending: Optional[str] = None
    continuous_or_alternating_legs: Optional[str] = None
    foot_elevation: Optional[bool] = None
    combination_exercises: Optional[bool] = None
    movement_pattern_1: Optional[str] = None
    movement_pattern_2: Optional[str] = None
    movement_pattern_3: Optional[str] = None
    plane_of_motion_1: Optional[str] = None
    plane_of_motion_2: Optional[str] = None
    plane_of_motion_3: Optional[str] = None
    body_region: Optional[str] = None
    force_type: Optional[str] = None
    mechanics: Optional[str] = None
    laterality: Optional[str] = None
    primary_exercise_classification: Optional[str] = None

class ExerciseCreate(ExerciseBase):
    pass

class ExerciseUpdate(ExerciseBase):
    name: Optional[str] = None
    target_muscle_group: Optional[str] = None

class ExerciseResponse(ExerciseBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ExerciseImportResponse(BaseModel):
    total_imported: int
    errors: List[str] = []

class ExerciseFilter(BaseModel):
    target_muscle_group: Optional[str] = None
    difficulty_level: Optional[str] = None
    equipment: Optional[str] = None
    body_region: Optional[str] = None
    force_type: Optional[str] = None
    mechanics: Optional[str] = None