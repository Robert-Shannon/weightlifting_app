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
