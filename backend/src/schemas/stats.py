from pydantic import BaseModel
from typing import List, Dict, Optional, Any, Union
from datetime import datetime, date
from uuid import UUID

# Exercise Progress Stats
class ExerciseSetRecord(BaseModel):
    date: datetime
    weight: float
    reps: int
    is_personal_record: bool = False

class ExerciseVolumePoint(BaseModel):
    date: datetime
    volume: float  # Weight * Reps

class ExerciseMaxPoint(BaseModel):
    date: datetime
    weight: float
    reps: int

class ExerciseProgressStats(BaseModel):
    exercise_id: UUID
    exercise_name: str
    target_muscle_group: str
    personal_record_weight: Optional[float] = None
    personal_record_reps: Optional[int] = None
    personal_record_date: Optional[datetime] = None
    one_rep_max_estimated: Optional[float] = None
    recent_sets: List[ExerciseSetRecord]
    volume_over_time: List[ExerciseVolumePoint]
    max_weight_over_time: List[ExerciseMaxPoint]

# Muscle Group Stats
class MuscleGroupActivity(BaseModel):
    muscle_group: str
    volume: float  # Total volume (weight * reps)
    sets_count: int
    activity_level: float  # Normalized activity (0-1 scale)
    last_trained: Optional[datetime] = None
    recovery_status: Optional[float] = None  # Recovery status percentage (0-100)

class MuscleGroupStats(BaseModel):
    date_range_start: datetime
    date_range_end: datetime
    muscle_groups: List[MuscleGroupActivity]

# Personal Records
class PersonalRecord(BaseModel):
    id: UUID
    exercise_id: UUID
    exercise_name: str
    target_muscle_group: str
    weight: float
    reps: int
    date: datetime
    estimated_one_rep_max: Optional[float] = None
    previous_record: Optional[Dict[str, Any]] = None
    improvement_percentage: Optional[float] = None

class PersonalRecordsResponse(BaseModel):
    records: List[PersonalRecord]
    total_count: int

# Workout Overview
class WorkoutOverview(BaseModel):
    total_workouts: int
    total_duration: int  # In minutes
    total_volume: float
    avg_workout_duration: int  # In minutes
    most_trained_muscle: str
    workout_consistency: float  # as percentage of target
    most_recent_workout: Optional[datetime] = None
    busiest_day: Optional[str] = None  # Day of week
    busiest_time: Optional[str] = None  # Time of day

# Workout Trends
class TrendPoint(BaseModel):
    date: datetime
    value: float

class WorkoutTrends(BaseModel):
    metric: str  # 'volume', 'duration', 'frequency'
    period: str  # 'daily', 'weekly', 'monthly'
    data: List[TrendPoint]

# Filters for stats
class StatsTimeRangeFilter(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    period: Optional[str] = "all"  # "all", "week", "month", "year"

class ExerciseStatsFilter(StatsTimeRangeFilter):
    target_muscle_group: Optional[str] = None
    equipment: Optional[str] = None

class MuscleGroupFilter(StatsTimeRangeFilter):
    include_exercises: bool = False