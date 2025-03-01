import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
import os
from datetime import datetime, timedelta

from src.main import app
from src.core.database.session import get_db, Base
from src.models.user import User
from src.models.exercise import Exercise
from src.models.workout import (
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet
)
from src.utils.auth import get_password_hash, create_access_token

# Setup test database with PostgreSQL (same as test_auth.py, test_sessions.py, test_templates.py)
TEST_POSTGRES_URL = os.getenv(
    "TEST_DATABASE_URL", 
    "postgresql://robertshannon:postgres@localhost:5432/test_weightlifting_app"
)

engine = create_engine(TEST_POSTGRES_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Create the test database tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Create a new session for the test
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function")
def client(db):
    # Override the get_db dependency to use our test database
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db):
    """Create a test user and get an auth token"""
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        name="Test User",
        email="test@example.com",
        password_hash=get_password_hash("password123")
    )
    db.add(user)
    db.commit()
    
    token = create_access_token(str(user_id))
    return {"user": user, "token": token}

@pytest.fixture
def test_exercises(db):
    """Create multiple test exercises for different muscle groups"""
    exercises = []
    for i, muscle_group in enumerate(["Chest", "Back", "Legs", "Shoulders", "Arms"]):
        exercise = Exercise(
            id=uuid.uuid4(),
            name=f"Test Exercise {i+1}",
            target_muscle_group=muscle_group,
            difficulty_level="Intermediate",
            primary_equipment="Barbell"
        )
        db.add(exercise)
        exercises.append(exercise)
    db.commit()
    
    return exercises

@pytest.fixture
def test_workout_history(db, test_user, test_exercises):
    """Create some workout history for stats testing"""
    now = datetime.utcnow()
    
    # Create 3 workout sessions over the last week
    sessions = []
    
    for i in range(3):
        session_date = now - timedelta(days=i*2)
        session = WorkoutSession(
            id=uuid.uuid4(),
            user_id=test_user["user"].id,
            name=f"Test Workout {i+1}",
            started_at=session_date,
            completed_at=session_date + timedelta(hours=1),
            active_duration=3600  # 1 hour in seconds
        )
        db.add(session)
        db.flush()
        sessions.append(session)
    
    # Add exercises to each session (varying exercises and muscle groups)
    for session_idx, session in enumerate(sessions):
        # Add 2 exercises to each session
        for ex_idx in range(2):
            exercise = test_exercises[(session_idx + ex_idx) % len(test_exercises)]
            session_exercise = WorkoutSessionExercise(
                id=uuid.uuid4(),
                workout_session_id=session.id,
                exercise_id=exercise.id,
                order=ex_idx + 1,
                started_at=session.started_at + timedelta(minutes=ex_idx * 15),
                completed_at=session.started_at + timedelta(minutes=(ex_idx+1) * 15)
            )
            db.add(session_exercise)
            db.flush()
            
            # Add 3 sets for each exercise
            for set_idx in range(3):
                # Increasing weights to create progression
                weight = 100 + (session_idx * 5) + (set_idx * 5)
                reps = 10 - set_idx  # Decreasing reps
                
                workout_set = WorkoutSet(
                    id=uuid.uuid4(),
                    workout_session_exercise_id=session_exercise.id,
                    set_number=set_idx + 1,
                    reps_completed=reps,
                    weight=weight,
                    is_warmup=set_idx == 0,
                    completed_at=session_exercise.started_at + timedelta(minutes=set_idx * 5)
                )
                db.add(workout_set)
    
    db.commit()
    return {"sessions": sessions, "exercises": test_exercises}

def test_read_exercise_stats(client, test_user, test_workout_history):
    """Test getting stats for a specific exercise"""
    exercise = test_workout_history["exercises"][0]
    
    response = client.get(
        f"/api/v1/stats/exercise/{exercise.id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "exercise_id" in data
    assert data["exercise_name"] == exercise.name
    assert "personal_record_weight" in data
    assert "personal_record_reps" in data
    assert "recent_sets" in data
    assert "volume_over_time" in data
    assert "max_weight_over_time" in data

def test_read_muscle_group_stats(client, test_user, test_workout_history):
    """Test getting muscle group stats"""
    response = client.get(
        "/api/v1/stats/muscle-groups",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "date_range_start" in data
    assert "date_range_end" in data
    assert "muscle_groups" in data
    assert len(data["muscle_groups"]) > 0
    
    for muscle_group in data["muscle_groups"]:
        assert "muscle_group" in muscle_group
        assert "volume" in muscle_group
        assert "sets_count" in muscle_group
        assert "activity_level" in muscle_group

def test_read_personal_records(client, test_user, test_workout_history):
    """Test getting personal records"""
    response = client.get(
        "/api/v1/stats/personal-records",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "records" in data
    assert "total_count" in data
    assert len(data["records"]) <= 10  # Default limit
    
    if data["records"]:
        record = data["records"][0]
        assert "exercise_id" in record
        assert "exercise_name" in record
        assert "weight" in record
        assert "reps" in record
        assert "date" in record
        assert "estimated_one_rep_max" in record

def test_read_workout_overview(client, test_user, test_workout_history):
    """Test getting workout overview stats"""
    response = client.get(
        "/api/v1/stats/overview",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "total_workouts" in data
    assert data["total_workouts"] == 3  # From our fixture
    assert "total_duration" in data
    assert "total_volume" in data
    assert "avg_workout_duration" in data
    assert "most_trained_muscle" in data
    assert "workout_consistency" in data
    assert "most_recent_workout" in data
    assert "busiest_day" in data

def test_read_workout_trends(client, test_user, test_workout_history):
    """Test getting workout trends"""
    # Test volume trends
    response = client.get(
        "/api/v1/stats/trends?metric=volume&period=weekly",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["metric"] == "volume"
    assert data["period"] == "weekly"
    assert "data" in data
    assert len(data["data"]) > 0
    
    # Test duration trends
    response = client.get(
        "/api/v1/stats/trends?metric=duration&period=daily",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["metric"] == "duration"
    assert data["period"] == "daily"
    assert len(data["data"]) > 0
    
    # Test frequency trends
    response = client.get(
        "/api/v1/stats/trends?metric=frequency&period=monthly",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["metric"] == "frequency"
    assert data["period"] == "monthly"

def test_date_filtering(client, test_user, test_workout_history):
    """Test filtering stats by date range"""
    today = datetime.now().date().isoformat()
    week_ago = (datetime.now() - timedelta(days=7)).date().isoformat()
    
    response = client.get(
        f"/api/v1/stats/overview?start_date={week_ago}&end_date={today}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["total_workouts"] > 0

def test_invalid_metric_parameter(client, test_user):
    """Test invalid metric parameter is rejected"""
    response = client.get(
        "/api/v1/stats/trends?metric=invalid",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 400
    assert "Invalid metric" in response.json()["detail"]

def test_invalid_period_parameter(client, test_user):
    """Test invalid period parameter is rejected"""
    response = client.get(
        "/api/v1/stats/trends?period=invalid",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 400
    assert "Invalid period" in response.json()["detail"]

def test_auth_required(client):
    """Test that authentication is required for stats endpoints"""
    response = client.get("/api/v1/stats/overview")
    assert response.status_code == 401
    
    response = client.get("/api/v1/stats/muscle-groups")
    assert response.status_code == 401

def test_empty_data_response(client, test_user):
    """Test response format when user has no workout data"""
    # No need to create workout data, just use a clean database
    response = client.get(
        "/api/v1/stats/overview",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["total_workouts"] == 0