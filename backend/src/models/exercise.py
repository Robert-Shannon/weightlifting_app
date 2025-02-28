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
