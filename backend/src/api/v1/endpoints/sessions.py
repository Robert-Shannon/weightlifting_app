from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date

from src.core.database.session import get_db
from src.schemas.session import (
    SessionCreate, 
    SessionUpdate, 
    SessionResponse, 
    SessionListResponse,
    SessionComplete,
    SessionExerciseCreate,
    SessionExerciseResponse,
    SessionSetCreate,
    SessionSetUpdate,
    SessionSetResponse,
    SupersetCreate
)
from src.services.session_services import (
    get_sessions,
    get_session_by_id,
    get_session_with_exercises,
    create_session,
    update_session,
    complete_session,
    add_exercise_to_session,
    start_exercise,
    complete_exercise,
    log_set,
    update_set,
    start_rest,
    end_rest,
    create_superset
)
from src.utils.dependencies import get_current_user
from src.models.user import User

router = APIRouter()

@router.get("/", response_model=List[SessionListResponse])
def read_sessions(
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    template_id: Optional[UUID] = Query(None, description="Filter by template ID"),
    skip: int = Query(0, ge=0, description="Skip N items"),
    limit: int = Query(100, ge=1, le=100, description="Limit to N items"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a list of workout sessions with optional filtering.
    
    - **start_date**: Filter sessions starting on or after this date
    - **end_date**: Filter sessions starting on or before this date
    - **template_id**: Filter sessions by template ID
    - **skip**: Number of items to skip for pagination
    - **limit**: Maximum number of items to return
    """
    # Convert dates to datetime objects if provided
    start_datetime = datetime.combine(start_date, datetime.min.time()) if start_date else None
    end_datetime = datetime.combine(end_date, datetime.max.time()) if end_date else None
    
    sessions = get_sessions(
        db, 
        str(current_user.id), 
        skip=skip, 
        limit=limit, 
        template_id=str(template_id) if template_id else None,
        start_date=start_datetime,
        end_date=end_datetime
    )
    
    # Transform to response format with exercise count
    result = []
    for session in sessions:
        exercise_count = len(getattr(session, 'exercises', []))
        result.append(
            SessionListResponse(
                id=session.id,
                name=session.name,
                started_at=session.started_at,
                completed_at=session.completed_at,
                duration=session.active_duration,
                exercise_count=exercise_count
            )
        )
    
    return result

@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_new_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Start a new workout session.
    
    - **name**: Name of the session (e.g., "Monday Push Day")
    - **template_ids**: Optional list of template IDs to include exercises from
    """
    return create_session(db, str(current_user.id), session_data)

@router.get("/{session_id}", response_model=SessionResponse)
def read_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get workout session details including exercises and sets.
    """
    return get_session_with_exercises(db, str(session_id), str(current_user.id))

@router.put("/{session_id}", response_model=SessionResponse)
def update_session_details(
    session_id: UUID,
    session_data: SessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update session details (name, notes).
    """
    return update_session(db, str(session_id), str(current_user.id), session_data)

@router.post("/{session_id}/complete", response_model=SessionResponse)
def complete_workout_session(
    session_id: UUID,
    complete_data: Optional[SessionComplete] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a workout session as completed.
    
    - **completed_at**: Optional completion timestamp, defaults to current time
    """
    return complete_session(db, str(session_id), str(current_user.id), complete_data)

@router.post("/{session_id}/exercises", response_model=SessionExerciseResponse)
def add_exercise_to_workout_session(
    session_id: UUID,
    exercise_data: SessionExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add an exercise to an active workout session.
    
    - **exercise_id**: ID of the exercise to add
    - **order**: Position of the exercise in the workout
    - **notes**: Optional notes for the exercise
    """
    return add_exercise_to_session(db, str(session_id), str(current_user.id), exercise_data)

@router.post("/{session_id}/exercises/{exercise_id}/start", response_model=SessionExerciseResponse)
def start_exercise_in_session(
    session_id: UUID,
    exercise_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark an exercise as started in a workout session.
    """
    return start_exercise(db, str(session_id), str(exercise_id), str(current_user.id))

@router.post("/{session_id}/exercises/{exercise_id}/complete", response_model=SessionExerciseResponse)
def complete_exercise_in_session(
    session_id: UUID,
    exercise_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark an exercise as completed in a workout session.
    """
    return complete_exercise(db, str(session_id), str(exercise_id), str(current_user.id))

@router.post("/{session_id}/exercises/{exercise_id}/sets", response_model=SessionSetResponse)
def log_exercise_set(
    session_id: UUID,
    exercise_id: UUID,
    set_data: SessionSetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Log a completed set for an exercise in a workout session.
    
    - **set_number**: Number of the set (1, 2, 3, etc.)
    - **reps_completed**: Number of repetitions completed
    - **weight**: Weight used (optional)
    - **is_warmup**: Whether this is a warmup set (default: false)
    - **rpe**: Rate of Perceived Exertion (1-10, optional)
    - **notes**: Optional notes for the set
    """
    return log_set(db, str(session_id), str(exercise_id), str(current_user.id), set_data)

@router.put("/{session_id}/exercises/{exercise_id}/sets/{set_id}", response_model=SessionSetResponse)
def update_exercise_set(
    session_id: UUID,
    exercise_id: UUID,
    set_id: UUID,
    set_data: SessionSetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a logged set in a workout session.
    """
    return update_set(db, str(session_id), str(exercise_id), str(set_id), str(current_user.id), set_data)

@router.post("/{session_id}/exercises/{exercise_id}/sets/{set_id}/rest", response_model=SessionSetResponse)
def start_rest_timer(
    session_id: UUID,
    exercise_id: UUID,
    set_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Start rest timer after a set.
    """
    return start_rest(db, str(session_id), str(exercise_id), str(set_id), str(current_user.id))

@router.put("/{session_id}/exercises/{exercise_id}/sets/{set_id}/rest", response_model=SessionSetResponse)
def end_rest_timer(
    session_id: UUID,
    exercise_id: UUID,
    set_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    End rest timer and record rest duration.
    """
    return end_rest(db, str(session_id), str(exercise_id), str(set_id), str(current_user.id))

@router.post("/{session_id}/supersets", response_model=dict)
def create_superset_group(
    session_id: UUID,
    superset_data: SupersetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a superset group in an active session.
    
    - **exercise_ids**: List of exercise IDs to include in the superset
    - **orders**: List of order values for each exercise in the superset
    """
    return create_superset(db, str(session_id), str(current_user.id), superset_data)