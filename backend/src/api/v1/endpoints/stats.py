from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from uuid import UUID

from src.core.database.session import get_db
from src.schemas.stats import (
    ExerciseProgressStats,
    MuscleGroupStats,
    PersonalRecordsResponse,
    WorkoutOverview,
    WorkoutTrends,
    StatsTimeRangeFilter,
    ExerciseStatsFilter,
    MuscleGroupFilter
)
from src.services.stats_services import (
    get_exercise_progress,
    get_muscle_group_stats,
    get_personal_records,
    get_workout_overview,
    get_workout_trends
)
from src.utils.dependencies import get_current_user
from src.models.user import User

router = APIRouter()

@router.get("/exercise/{exercise_id}", response_model=ExerciseProgressStats)
def read_exercise_stats(
    exercise_id: UUID,
    start_date: Optional[date] = Query(None, description="Start date for stats period"),
    end_date: Optional[date] = Query(None, description="End date for stats period"),
    period: Optional[str] = Query("all", description="Stats period: 'all', 'week', 'month', 'year'"),
    target_muscle_group: Optional[str] = Query(None, description="Filter by target muscle group"),
    equipment: Optional[str] = Query(None, description="Filter by equipment"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get progress statistics for a specific exercise.
    
    Provides data on:
    - Personal records (weight, reps)
    - Estimated one-rep max
    - Recent sets
    - Volume over time
    - Max weight progression
    """
    filter_params = ExerciseStatsFilter(
        start_date=start_date,
        end_date=end_date,
        period=period,
        target_muscle_group=target_muscle_group,
        equipment=equipment
    )
    return get_exercise_progress(db, str(current_user.id), str(exercise_id), filter_params)

@router.get("/muscle-groups", response_model=MuscleGroupStats)
def read_muscle_group_stats(
    start_date: Optional[date] = Query(None, description="Start date for stats period"),
    end_date: Optional[date] = Query(None, description="End date for stats period"),
    period: Optional[str] = Query("all", description="Stats period: 'all', 'week', 'month', 'year'"),
    include_exercises: bool = Query(False, description="Include exercises for each muscle group"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get training volume and activity by muscle group.
    
    Provides data for muscle group heatmap visualization, showing:
    - Total volume by muscle group
    - Number of sets by muscle group
    - Activity level (normalized for visualization)
    - Last trained date
    - Recovery status
    """
    filter_params = MuscleGroupFilter(
        start_date=start_date,
        end_date=end_date,
        period=period,
        include_exercises=include_exercises
    )
    return get_muscle_group_stats(db, str(current_user.id), filter_params)

@router.get("/personal-records", response_model=PersonalRecordsResponse)
def read_personal_records(
    start_date: Optional[date] = Query(None, description="Start date for stats period"),
    end_date: Optional[date] = Query(None, description="End date for stats period"),
    period: Optional[str] = Query("all", description="Stats period: 'all', 'week', 'month', 'year'"),
    page: int = Query(0, ge=0, description="Page number for pagination"),
    limit: int = Query(10, ge=1, le=50, description="Number of records per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all personal records (PRs) for the user.
    
    Lists personal records for all exercises, with:
    - Exercise name and details
    - Weight and reps for the PR
    - Date achieved
    - Estimated one-rep max
    """
    filter_params = StatsTimeRangeFilter(
        start_date=start_date,
        end_date=end_date,
        period=period
    )
    return get_personal_records(db, str(current_user.id), filter_params, page, limit)

@router.get("/overview", response_model=WorkoutOverview)
def read_workout_overview(
    start_date: Optional[date] = Query(None, description="Start date for stats period"),
    end_date: Optional[date] = Query(None, description="End date for stats period"),
    period: Optional[str] = Query("all", description="Stats period: 'all', 'week', 'month', 'year'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get overview statistics for a user's workouts.
    
    Provides summary data like:
    - Total number of workouts
    - Total time spent working out
    - Total volume lifted
    - Average workout duration
    - Most trained muscle groups
    - Workout consistency (as percentage of target)
    - Most recent workout
    - Busiest day of week and time of day
    """
    filter_params = StatsTimeRangeFilter(
        start_date=start_date,
        end_date=end_date,
        period=period
    )
    return get_workout_overview(db, str(current_user.id), filter_params)

@router.get("/trends", response_model=WorkoutTrends)
def read_workout_trends(
    metric: str = Query("volume", description="Metric to track: 'volume', 'duration', 'frequency'"),
    period: str = Query("weekly", description="Grouping period: 'daily', 'weekly', 'monthly'"),
    start_date: Optional[date] = Query(None, description="Start date for stats period"),
    end_date: Optional[date] = Query(None, description="End date for stats period"),
    time_period: Optional[str] = Query("all", description="Stats period: 'all', 'week', 'month', 'year'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get trends over time for selected metric.
    
    Provides data points for charting:
    - Volume trends (total weight lifted)
    - Duration trends (time spent working out)
    - Frequency trends (number of workouts)
    
    Data can be grouped by day, week, or month.
    """
    if metric not in ["volume", "duration", "frequency"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid metric. Must be 'volume', 'duration', or 'frequency'"
        )
    
    if period not in ["daily", "weekly", "monthly"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid period. Must be 'daily', 'weekly', or 'monthly'"
        )
    
    filter_params = StatsTimeRangeFilter(
        start_date=start_date,
        end_date=end_date,
        period=time_period
    )
    return get_workout_trends(db, str(current_user.id), filter_params, metric, period)