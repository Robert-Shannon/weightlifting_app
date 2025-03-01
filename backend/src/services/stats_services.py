from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract, and_, or_
from fastapi import HTTPException, status
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional, Any, Union
import math
import uuid
from uuid import UUID

from src.models.workout import (
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet,
    WorkoutSessionMetrics
)
from src.models.exercise import Exercise
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

def apply_date_filter(query, filter: StatsTimeRangeFilter, date_column):
    """Apply date range filters to query"""
    if filter.start_date:
        start_datetime = datetime.combine(filter.start_date, datetime.min.time())
        query = query.filter(date_column >= start_datetime)
    
    if filter.end_date:
        end_datetime = datetime.combine(filter.end_date, datetime.max.time())
        query = query.filter(date_column <= end_datetime)
    
    if filter.period and filter.period != "all" and not (filter.start_date and filter.end_date):
        today = datetime.now()
        if filter.period == "week":
            start_date = today - timedelta(days=7)
        elif filter.period == "month":
            start_date = today - timedelta(days=30)
        elif filter.period == "year":
            start_date = today - timedelta(days=365)
        else:
            start_date = None
            
        if start_date:
            query = query.filter(date_column >= start_date)
    
    return query

def estimate_one_rep_max(weight: float, reps: int) -> float:
    """Estimate one rep max using Brzycki formula"""
    if reps == 0:
        return 0
    if reps == 1:
        return weight
    return weight * (36 / (37 - reps))

def get_exercise_progress(db: Session, user_id: str, exercise_id: str, filter: ExerciseStatsFilter = None):
    """
    Get progress stats for a specific exercise
    """
    # Verify the exercise exists
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found"
        )
    
    # Base query for this user's sets of this exercise
    query = db.query(WorkoutSet).\
        join(WorkoutSessionExercise, WorkoutSet.workout_session_exercise_id == WorkoutSessionExercise.id).\
        join(WorkoutSession, WorkoutSessionExercise.workout_session_id == WorkoutSession.id).\
        filter(
            WorkoutSession.user_id == user_id,
            WorkoutSessionExercise.exercise_id == exercise_id,
            WorkoutSet.is_warmup == False  # Exclude warmup sets
        )
    
    # Apply date filters
    if filter:
        query = apply_date_filter(query, filter, WorkoutSession.started_at)
    
    # Get all sets for this exercise
    exercise_sets = query.order_by(WorkoutSession.started_at.desc()).all()
    
    if not exercise_sets:
        # Return empty stats if no sets found
        return ExerciseProgressStats(
            exercise_id=exercise_id,
            exercise_name=exercise.name,
            target_muscle_group=exercise.target_muscle_group,
            recent_sets=[],
            volume_over_time=[],
            max_weight_over_time=[]
        )
    
    # Calculate PR and one-rep max
    max_weight_set = max(exercise_sets, key=lambda s: s.weight if s.weight else 0)
    max_reps_set = max(exercise_sets, key=lambda s: s.reps_completed if s.reps_completed else 0)
    
    # Group sets by workout session for volume and progress tracking
    sets_by_session = {}
    session_dates = {}
    
    # First pass to get dates and organize sets by session
    for set_data in exercise_sets:
        # Get session data through relationships
        session_exercise = db.query(WorkoutSessionExercise).get(set_data.workout_session_exercise_id)
        if not session_exercise:
            continue
            
        session = db.query(WorkoutSession).get(session_exercise.workout_session_id)
        if not session or not session.started_at:
            continue
            
        session_id = str(session.id)
        if session_id not in sets_by_session:
            sets_by_session[session_id] = []
            session_dates[session_id] = session.started_at
            
        sets_by_session[session_id].append(set_data)
    
    # Process volume over time
    volume_points = []
    max_points = []
    
    for session_id, sets in sets_by_session.items():
        date = session_dates[session_id]
        
        # Calculate total volume for this session
        session_volume = sum(
            (s.weight or 0) * (s.reps_completed or 0) 
            for s in sets if s.weight and s.reps_completed
        )
        
        # Add volume data point
        if session_volume > 0:
            volume_points.append({
                "date": date,
                "volume": session_volume
            })
        
        # Find max weight for this session
        if sets:
            max_weight_set = max(sets, key=lambda s: s.weight if s.weight else 0)
            if max_weight_set.weight and max_weight_set.reps_completed:
                max_points.append({
                    "date": date,
                    "weight": max_weight_set.weight,
                    "reps": max_weight_set.reps_completed
                })
    
    # Sort data points by date
    volume_points.sort(key=lambda x: x["date"])
    max_points.sort(key=lambda x: x["date"])
    
    # Generate one-rep max estimation from best set
    best_one_rep_max = 0
    for s in exercise_sets:
        if s.weight and s.reps_completed:
            one_rm = estimate_one_rep_max(s.weight, s.reps_completed)
            best_one_rep_max = max(best_one_rep_max, one_rm)
    
    # Get recent sets (most recent workout sessions)
    recent_sets = []
    recent_session_ids = list(session_dates.keys())
    recent_session_ids.sort(key=lambda sid: session_dates[sid], reverse=True)
    recent_session_ids = recent_session_ids[:3]  # Last 3 sessions
    
    for session_id in recent_session_ids:
        for set_data in sets_by_session[session_id]:
            if set_data.weight and set_data.reps_completed:
                recent_sets.append({
                    "date": session_dates[session_id],
                    "weight": set_data.weight,
                    "reps": set_data.reps_completed,
                    "is_personal_record": (
                        set_data.weight == max_weight_set.weight and 
                        set_data.reps_completed == max_weight_set.reps_completed
                    )
                })
    
    # Return processed stats
    return ExerciseProgressStats(
        exercise_id=exercise_id,
        exercise_name=exercise.name,
        target_muscle_group=exercise.target_muscle_group,
        personal_record_weight=max_weight_set.weight if max_weight_set.weight else None,
        personal_record_reps=max_reps_set.reps_completed if max_reps_set.reps_completed else None,
        personal_record_date=session_dates.get(
            next((sid for sid, sets in sets_by_session.items() 
                  if max_weight_set in sets), None)
        ),
        one_rep_max_estimated=best_one_rep_max if best_one_rep_max > 0 else None,
        recent_sets=recent_sets,
        volume_over_time=volume_points,
        max_weight_over_time=max_points
    )

def get_muscle_group_stats(db: Session, user_id: str, filter: MuscleGroupFilter = None):
    """
    Get training volume and activity by muscle group
    """
    # Get completed workout sessions
    query = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == user_id,
        WorkoutSession.completed_at.isnot(None)
    )
    
    # Apply date filters
    if filter:
        query = apply_date_filter(query, filter, WorkoutSession.started_at)
    
    sessions = query.all()
    session_ids = [str(s.id) for s in sessions]
    
    if not session_ids:
        # Return empty stats if no completed sessions
        return MuscleGroupStats(
            date_range_start=datetime.now(),
            date_range_end=datetime.now(),
            muscle_groups=[]
        )
    
    # Query for all exercises in these sessions
    session_exercises = db.query(WorkoutSessionExercise).\
        filter(WorkoutSessionExercise.workout_session_id.in_(session_ids)).all()
    
    session_exercise_ids = [str(se.id) for se in session_exercises]
    exercise_ids = [str(se.exercise_id) for se in session_exercises]
    
    # Get exercise details for muscle group info
    exercises = db.query(Exercise).filter(Exercise.id.in_(exercise_ids)).all()
    exercise_map = {str(e.id): e for e in exercises}
    
    # Get all sets for these exercises
    sets = db.query(WorkoutSet).\
        filter(WorkoutSet.workout_session_exercise_id.in_(session_exercise_ids)).all()
    
    # Organize sets by session exercise
    sets_by_exercise = {}
    for set_data in sets:
        exercise_id = str(set_data.workout_session_exercise_id)
        if exercise_id not in sets_by_exercise:
            sets_by_exercise[exercise_id] = []
        sets_by_exercise[exercise_id].append(set_data)
    
    # Calculate volume by muscle group
    volume_by_muscle = {}
    sets_by_muscle = {}
    last_trained_by_muscle = {}
    
    for se in session_exercises:
        exercise_id = str(se.exercise_id)
        session_exercise_id = str(se.id)
        
        # Skip if exercise not found or no sets
        if exercise_id not in exercise_map or session_exercise_id not in sets_by_exercise:
            continue
            
        exercise = exercise_map[exercise_id]
        muscle_group = exercise.target_muscle_group
        
        if not muscle_group:
            continue
            
        # Initialize if first time seeing this muscle
        if muscle_group not in volume_by_muscle:
            volume_by_muscle[muscle_group] = 0
            sets_by_muscle[muscle_group] = 0
            last_trained_by_muscle[muscle_group] = None
        
        # Get session time for last_trained tracking
        session = next((s for s in sessions if str(s.id) == str(se.workout_session_id)), None)
        if session and session.completed_at:
            if (last_trained_by_muscle[muscle_group] is None or
                session.completed_at > last_trained_by_muscle[muscle_group]):
                last_trained_by_muscle[muscle_group] = session.completed_at
        
        # Calculate volume for this exercise's sets
        exercise_sets = sets_by_exercise.get(session_exercise_id, [])
        for set_data in exercise_sets:
            if set_data.weight and set_data.reps_completed:
                volume = set_data.weight * set_data.reps_completed
                volume_by_muscle[muscle_group] += volume
                sets_by_muscle[muscle_group] += 1
    
    # Find max volume for normalization
    max_volume = max(volume_by_muscle.values()) if volume_by_muscle else 1
    
    # Create response objects for each muscle group
    muscle_group_activities = []
    for muscle, volume in volume_by_muscle.items():
        # Normalize activity level (0-1)
        activity_level = volume / max_volume if max_volume > 0 else 0
        
        # Calculate recovery status
        recovery_status = None
        last_trained = last_trained_by_muscle.get(muscle)
        if last_trained:
            days_since_trained = (datetime.now() - last_trained).days
            # Simple recovery model: 100% recovered after 3 days
            recovery_status = min(100, days_since_trained * 33.33)
        
        muscle_group_activities.append({
            "muscle_group": muscle,
            "volume": volume,
            "sets_count": sets_by_muscle.get(muscle, 0),
            "activity_level": activity_level,
            "last_trained": last_trained,
            "recovery_status": recovery_status
        })
    
    # Sort by activity level descending
    muscle_group_activities.sort(key=lambda x: x["activity_level"], reverse=True)
    
    # Determine date range
    date_range_start = min(s.started_at for s in sessions if s.started_at)
    date_range_end = max(s.completed_at for s in sessions if s.completed_at)
    
    return MuscleGroupStats(
        date_range_start=date_range_start,
        date_range_end=date_range_end,
        muscle_groups=muscle_group_activities
    )

def get_personal_records(db: Session, user_id: str, filter: StatsTimeRangeFilter = None, 
                       page: int = 0, limit: int = 10):
    """
    Get all personal records for a user
    """
    # A PR is defined as the heaviest weight lifted for a given number of reps on an exercise
    
    # First, get all exercises the user has done
    query = db.query(Exercise).\
        join(WorkoutSessionExercise, Exercise.id == WorkoutSessionExercise.exercise_id).\
        join(WorkoutSession, WorkoutSessionExercise.workout_session_id == WorkoutSession.id).\
        filter(WorkoutSession.user_id == user_id).\
        distinct()
    
    exercises = query.all()
    exercise_ids = [str(e.id) for e in exercises]
    exercise_map = {str(e.id): e for e in exercises}
    
    if not exercise_ids:
        return PersonalRecordsResponse(records=[], total_count=0)
    
    # For each exercise, find the PR
    all_records = []
    
    for exercise_id in exercise_ids:
        # Get all sets for this exercise
        sets_query = db.query(WorkoutSet).\
            join(WorkoutSessionExercise, WorkoutSet.workout_session_exercise_id == WorkoutSessionExercise.id).\
            join(WorkoutSession, WorkoutSessionExercise.workout_session_id == WorkoutSession.id).\
            filter(
                WorkoutSession.user_id == user_id,
                WorkoutSessionExercise.exercise_id == exercise_id,
                WorkoutSet.is_warmup == False  # Exclude warmup sets
            )
        
        # Apply date filter
        if filter:
            sets_query = apply_date_filter(sets_query, filter, WorkoutSession.started_at)
        
        # Group by rep count
        rep_groups = {}
        for set_data in sets_query.all():
            if not set_data.reps_completed or not set_data.weight:
                continue
                
            reps = set_data.reps_completed
            if reps not in rep_groups:
                rep_groups[reps] = []
            rep_groups[reps].append(set_data)
        
        # Find PR for each rep count
        for reps, sets in rep_groups.items():
            if not sets:
                continue
                
            # Get max weight for this rep count
            pr_set = max(sets, key=lambda s: s.weight)
            
            # Get session details for date
            session_exercise = db.query(WorkoutSessionExercise).get(pr_set.workout_session_exercise_id)
            if not session_exercise:
                continue
                
            session = db.query(WorkoutSession).get(session_exercise.workout_session_id)
            if not session or not session.completed_at:
                continue
            
            # Get exercise details
            exercise = exercise_map.get(exercise_id)
            if not exercise:
                continue
            
            # Create PR record
            record = {
                "id": uuid.uuid4(),
                "exercise_id": exercise_id,
                "exercise_name": exercise.name,
                "target_muscle_group": exercise.target_muscle_group,
                "weight": pr_set.weight,
                "reps": reps,
                "date": session.completed_at,
                "estimated_one_rep_max": estimate_one_rep_max(pr_set.weight, reps)
            }
            
            all_records.append(record)
    
    # Sort by estimated one rep max descending
    all_records.sort(key=lambda x: x.get("estimated_one_rep_max", 0), reverse=True)
    
    # Total count for pagination
    total_count = len(all_records)
    
    # Apply pagination
    start_idx = page * limit
    end_idx = start_idx + limit
    paginated_records = all_records[start_idx:end_idx]
    
    return PersonalRecordsResponse(
        records=paginated_records,
        total_count=total_count
    )

def get_workout_overview(db: Session, user_id: str, filter: StatsTimeRangeFilter = None):
    """
    Get overview stats for a user's workouts
    """
    # Get all workouts for this user
    query = db.query(WorkoutSession).filter(WorkoutSession.user_id == user_id)
    
    # Apply date filter
    if filter:
        query = apply_date_filter(query, filter, WorkoutSession.started_at)
    
    sessions = query.all()
    
    if not sessions:
        return WorkoutOverview(
            total_workouts=0,
            total_duration=0,
            total_volume=0,
            avg_workout_duration=0,
            most_trained_muscle="None",
            workout_consistency=0
        )
    
    # Calculate basic stats
    completed_sessions = [s for s in sessions if s.completed_at]
    total_workouts = len(completed_sessions)
    
    if total_workouts == 0:
        return WorkoutOverview(
            total_workouts=0,
            total_duration=0,
            total_volume=0,
            avg_workout_duration=0,
            most_trained_muscle="None",
            workout_consistency=0
        )
    
    # Calculate total duration in minutes
    total_duration = sum(
        (s.active_duration or 0) / 60 for s in completed_sessions
    )
    
    # Calculate average duration
    avg_duration = total_duration / total_workouts if total_workouts > 0 else 0
    
    # Find most recent workout
    most_recent = max(sessions, key=lambda s: s.started_at if s.started_at else datetime.min)
    
    # Calculate volume and find most trained muscle group
    session_ids = [str(s.id) for s in sessions]
    
    # Get all exercises from these sessions
    session_exercises = db.query(WorkoutSessionExercise).\
        filter(WorkoutSessionExercise.workout_session_id.in_(session_ids)).all()
    
    session_exercise_ids = [str(se.id) for se in session_exercises]
    exercise_ids = [str(se.exercise_id) for se in session_exercises]
    
    # Get exercise details for muscle group info
    exercises = db.query(Exercise).filter(Exercise.id.in_(exercise_ids)).all()
    exercise_map = {str(e.id): e for e in exercises}
    
    # Get all sets for these exercises
    sets = db.query(WorkoutSet).\
        filter(WorkoutSet.workout_session_exercise_id.in_(session_exercise_ids)).all()
    
    # Calculate total volume and muscle group activity
    total_volume = 0
    volume_by_muscle = {}
    
    for set_data in sets:
        # Skip if no weight or reps
        if not set_data.weight or not set_data.reps_completed:
            continue
            
        # Calculate set volume
        set_volume = set_data.weight * set_data.reps_completed
        total_volume += set_volume
        
        # Track by muscle group
        session_exercise = next(
            (se for se in session_exercises if str(se.id) == str(set_data.workout_session_exercise_id)), 
            None
        )
        if not session_exercise:
            continue
            
        exercise_id = str(session_exercise.exercise_id)
        exercise = exercise_map.get(exercise_id)
        
        if not exercise or not exercise.target_muscle_group:
            continue
            
        muscle = exercise.target_muscle_group
        volume_by_muscle[muscle] = volume_by_muscle.get(muscle, 0) + set_volume
    
    # Determine most trained muscle
    most_trained = max(volume_by_muscle.items(), key=lambda x: x[1])[0] if volume_by_muscle else "None"
    
    # Calculate workout consistency (workouts per week)
    if len(sessions) >= 2:
        first_workout = min(sessions, key=lambda s: s.started_at if s.started_at else datetime.max)
        last_workout = max(sessions, key=lambda s: s.started_at if s.started_at else datetime.min)
        
        if first_workout.started_at and last_workout.started_at:
            days_span = (last_workout.started_at - first_workout.started_at).days
            if days_span > 0:
                weeks_span = days_span / 7
                workouts_per_week = total_workouts / weeks_span if weeks_span > 0 else 0
                # Assuming target is 3 workouts per week
                consistency = min(100, (workouts_per_week / 3) * 100)
            else:
                consistency = 100  # All workouts on same day
        else:
            consistency = 0
    else:
        consistency = 0
    
    # Determine busiest day of week
    day_counts = {}
    for session in sessions:
        if not session.started_at:
            continue
            
        day_of_week = session.started_at.strftime("%A")
        day_counts[day_of_week] = day_counts.get(day_of_week, 0) + 1
    
    busiest_day = max(day_counts.items(), key=lambda x: x[1])[0] if day_counts else None
    
    # Determine busiest time of day
    hour_counts = {}
    for session in sessions:
        if not session.started_at:
            continue
            
        hour = session.started_at.hour
        # Group into morning, afternoon, evening
        if 5 <= hour < 12:
            time_of_day = "Morning"
        elif 12 <= hour < 17:
            time_of_day = "Afternoon"
        elif 17 <= hour < 22:
            time_of_day = "Evening"
        else:
            time_of_day = "Night"
            
        hour_counts[time_of_day] = hour_counts.get(time_of_day, 0) + 1
    
    busiest_time = max(hour_counts.items(), key=lambda x: x[1])[0] if hour_counts else None
    
    return WorkoutOverview(
        total_workouts=total_workouts,
        total_duration=round(total_duration),
        total_volume=round(total_volume, 1),
        avg_workout_duration=round(avg_duration),
        most_trained_muscle=most_trained,
        workout_consistency=round(consistency, 1),
        most_recent_workout=most_recent.completed_at,
        busiest_day=busiest_day,
        busiest_time=busiest_time
    )

def get_workout_trends(db: Session, user_id: str, filter: StatsTimeRangeFilter = None, 
                    metric: str = "volume", period: str = "weekly"):
    """
    Get trends over time for selected metric
    Valid metrics: volume, duration, frequency
    Valid periods: daily, weekly, monthly
    """
    # Get all workouts for this user
    query = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == user_id,
        WorkoutSession.completed_at.isnot(None)
    )
    
    # Apply date filter
    if filter:
        query = apply_date_filter(query, filter, WorkoutSession.started_at)
    
    sessions = query.all()
    
    if not sessions:
        return WorkoutTrends(
            metric=metric,
            period=period,
            data=[]
        )
    
    # Group sessions by time period
    data_points = []
    
    if period == "daily":
        # Group by day
        sessions_by_day = {}
        for session in sessions:
            if not session.completed_at:
                continue
                
            day_key = session.completed_at.date()
            if day_key not in sessions_by_day:
                sessions_by_day[day_key] = []
            sessions_by_day[day_key].append(session)
        
        # Process each day
        for day, day_sessions in sessions_by_day.items():
            day_datetime = datetime.combine(day, datetime.min.time())
            
            if metric == "volume":
                # Calculate total volume for the day
                day_volume = 0
                for session in day_sessions:
                    # Get exercises in this session
                    session_exercises = db.query(WorkoutSessionExercise).\
                        filter(WorkoutSessionExercise.workout_session_id == session.id).all()
                    
                    for se in session_exercises:
                        # Get sets for this exercise
                        sets = db.query(WorkoutSet).\
                            filter(WorkoutSet.workout_session_exercise_id == se.id).all()
                        
                        # Add up volume
                        for set_data in sets:
                            if set_data.weight and set_data.reps_completed:
                                day_volume += set_data.weight * set_data.reps_completed
                
                data_points.append({
                    "date": day_datetime,
                    "value": day_volume
                })
                
            elif metric == "duration":
                # Sum up workout durations for the day
                day_duration = sum(s.active_duration or 0 for s in day_sessions) / 60  # Convert to minutes
                
                data_points.append({
                    "date": day_datetime,
                    "value": day_duration
                })
                
            elif metric == "frequency":
                # Number of workouts on this day
                data_points.append({
                    "date": day_datetime,
                    "value": len(day_sessions)
                })
    
    elif period == "weekly":
        # Group by week
        sessions_by_week = {}
        for session in sessions:
            if not session.completed_at:
                continue
                
            # Get start of week (Monday)
            week_start = session.completed_at.date() - timedelta(days=session.completed_at.weekday())
            if week_start not in sessions_by_week:
                sessions_by_week[week_start] = []
            sessions_by_week[week_start].append(session)
        
        # Process each week
        for week_start, week_sessions in sessions_by_week.items():
            week_datetime = datetime.combine(week_start, datetime.min.time())
            
            if metric == "volume":
                # Calculate total volume for the week
                week_volume = 0
                for session in week_sessions:
                    # Get exercises in this session
                    session_exercises = db.query(WorkoutSessionExercise).\
                        filter(WorkoutSessionExercise.workout_session_id == session.id).all()
                    
                    for se in session_exercises:
                        # Get sets for this exercise
                        sets = db.query(WorkoutSet).\
                            filter(WorkoutSet.workout_session_exercise_id == se.id).all()
                        
                        # Add up volume
                        for set_data in sets:
                            if set_data.weight and set_data.reps_completed:
                                week_volume += set_data.weight * set_data.reps_completed
                
                data_points.append({
                    "date": week_datetime,
                    "value": week_volume
                })
                
            elif metric == "duration":
                # Sum up workout durations for the week
                week_duration = sum(s.active_duration or 0 for s in week_sessions) / 60  # Convert to minutes
                
                data_points.append({
                    "date": week_datetime,
                    "value": week_duration
                })
                
            elif metric == "frequency":
                # Number of workouts this week
                data_points.append({
                    "date": week_datetime,
                    "value": len(week_sessions)
                })
    
    elif period == "monthly":
        # Group by month
        sessions_by_month = {}
        for session in sessions:
            if not session.completed_at:
                continue
                
            # Get start of month
            month_key = session.completed_at.replace(day=1).date()
            if month_key not in sessions_by_month:
                sessions_by_month[month_key] = []
            sessions_by_month[month_key].append(session)
        
        # Process each month
        for month_start, month_sessions in sessions_by_month.items():
            month_datetime = datetime.combine(month_start, datetime.min.time())
            
            if metric == "volume":
                # Calculate total volume for the month
                month_volume = 0
                for session in month_sessions:
                    # Get exercises in this session
                    session_exercises = db.query(WorkoutSessionExercise).\
                        filter(WorkoutSessionExercise.workout_session_id == session.id).all()
                    
                    for se in session_exercises:
                        # Get sets for this exercise
                        sets = db.query(WorkoutSet).\
                            filter(WorkoutSet.workout_session_exercise_id == se.id).all()
                        
                        # Add up volume
                        for set_data in sets:
                            if set_data.weight and set_data.reps_completed:
                                month_volume += set_data.weight * set_data.reps_completed
                
                data_points.append({
                    "date": month_datetime,
                    "value": month_volume
                })
                
            elif metric == "duration":
                # Sum up workout durations for the month
                month_duration = sum(s.active_duration or 0 for s in month_sessions) / 60  # Convert to minutes
                
                data_points.append({
                    "date": month_datetime,
                    "value": month_duration
                })
                
            elif metric == "frequency":
                # Number of workouts this month
                data_points.append({
                    "date": month_datetime,
                    "value": len(month_sessions)
                })
    
    # Sort by date
    data_points.sort(key=lambda x: x["date"])
    
    return WorkoutTrends(
        metric=metric,
        period=period,
        data=data_points
    )