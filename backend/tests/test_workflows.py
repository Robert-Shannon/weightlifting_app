import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
import os
import json
from datetime import datetime, timedelta
import time

from src.main import app
from src.core.database.session import get_db, Base
from src.models.user import User
from src.models.exercise import Exercise
from src.models.workout import (
    WorkoutTemplate,
    WorkoutTemplateExercise,
    WorkoutTemplateSet,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet
)

# Setup test database
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", 
    "postgresql://robertshannon:postgres@localhost:5432/test_weightlifting_app"
)

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
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

@pytest.fixture(scope="module")
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

@pytest.fixture(scope="module")
def seed_exercises(db):
    """Create a variety of exercises for different muscle groups"""
    exercises = []
    exercise_data = [
        # Chest exercises
        {"name": "Bench Press", "target_muscle_group": "Chest", "primary_equipment": "Barbell"},
        {"name": "Incline Dumbbell Press", "target_muscle_group": "Chest", "primary_equipment": "Dumbbell"},
        {"name": "Chest Fly", "target_muscle_group": "Chest", "primary_equipment": "Cable"},
        
        # Back exercises
        {"name": "Barbell Row", "target_muscle_group": "Back", "primary_equipment": "Barbell"},
        {"name": "Pull-up", "target_muscle_group": "Back", "primary_equipment": "Bodyweight"},
        {"name": "Lat Pulldown", "target_muscle_group": "Back", "primary_equipment": "Cable"},
        
        # Leg exercises
        {"name": "Squat", "target_muscle_group": "Legs", "primary_equipment": "Barbell"},
        {"name": "Leg Press", "target_muscle_group": "Legs", "primary_equipment": "Machine"},
        {"name": "Romanian Deadlift", "target_muscle_group": "Legs", "primary_equipment": "Barbell"},
        
        # Shoulder exercises
        {"name": "Overhead Press", "target_muscle_group": "Shoulders", "primary_equipment": "Barbell"},
        {"name": "Lateral Raise", "target_muscle_group": "Shoulders", "primary_equipment": "Dumbbell"},
        
        # Arms exercises
        {"name": "Bicep Curl", "target_muscle_group": "Arms", "primary_equipment": "Dumbbell"},
        {"name": "Tricep Extension", "target_muscle_group": "Arms", "primary_equipment": "Cable"}
    ]
    
    for data in exercise_data:
        exercise = Exercise(
            id=uuid.uuid4(),
            name=data["name"],
            target_muscle_group=data["target_muscle_group"],
            difficulty_level="Intermediate",
            primary_equipment=data["primary_equipment"]
        )
        db.add(exercise)
        exercises.append(exercise)
    
    db.commit()
    return exercises

@pytest.fixture(scope="module")
def registered_user(client):
    """Register a test user and get their token"""
    response = client.post(
        "/api/v1/users/register",
        json={
            "name": "Test Lifter",
            "email": "lifter@example.com",
            "password": "workout123"
        }
    )
    data = response.json()
    return {
        "id": data["id"],
        "name": data["name"],
        "email": data["email"],
        "token": data["token"]
    }

def test_complete_user_workflow(client, db, seed_exercises, registered_user):
    """
    Test the complete user workflow:
    1. Creating workout templates
    2. Starting workouts
    3. Logging workout performance
    4. Analyzing progress
    """
    token = registered_user["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 1: View available exercises
    response = client.get("/api/v1/exercises/", headers=headers)
    assert response.status_code == 200
    exercises = response.json()
    assert len(exercises) >= 13  # We added 13 exercises in the seed
    
    # Get exercise IDs by muscle group for later use
    chest_exercises = [ex for ex in exercises if ex["target_muscle_group"] == "Chest"]
    back_exercises = [ex for ex in exercises if ex["target_muscle_group"] == "Back"]
    leg_exercises = [ex for ex in exercises if ex["target_muscle_group"] == "Legs"]
    
    # Step 2: Create a Push workout template
    push_template_response = client.post(
        "/api/v1/templates/",
        json={
            "name": "Push Workout",
            "description": "Chest, shoulders and triceps workout"
        },
        headers=headers
    )
    assert push_template_response.status_code == 201
    push_template = push_template_response.json()
    
    # Step 3: Add exercises to the Push template
    
    # Add bench press
    bench_press = next(ex for ex in chest_exercises if ex["name"] == "Bench Press")
    bench_response = client.post(
        f"/api/v1/templates/{push_template['id']}/exercises",
        json={
            "exercise_id": bench_press["id"],
            "order": 1,
            "notes": "Focus on controlled descent"
        },
        headers=headers
    )
    assert bench_response.status_code == 200
    bench_exercise = bench_response.json()
    
    # Add incline dumbbell press
    incline_press = next(ex for ex in chest_exercises if ex["name"] == "Incline Dumbbell Press")
    incline_response = client.post(
        f"/api/v1/templates/{push_template['id']}/exercises",
        json={
            "exercise_id": incline_press["id"],
            "order": 2,
            "notes": "Keep shoulders back"
        },
        headers=headers
    )
    assert incline_response.status_code == 200
    incline_exercise = incline_response.json()
    
    # Add overhead press
    overhead_press = next(ex for ex in exercises if ex["name"] == "Overhead Press")
    overhead_response = client.post(
        f"/api/v1/templates/{push_template['id']}/exercises",
        json={
            "exercise_id": overhead_press["id"],
            "order": 3,
            "notes": "Brace core"
        },
        headers=headers
    )
    assert overhead_response.status_code == 200
    overhead_exercise = overhead_response.json()
    
    # Add tricep extension
    tricep = next(ex for ex in exercises if ex["name"] == "Tricep Extension")
    tricep_response = client.post(
        f"/api/v1/templates/{push_template['id']}/exercises",
        json={
            "exercise_id": tricep["id"],
            "order": 4,
            "notes": "Keep elbows tucked"
        },
        headers=headers
    )
    assert tricep_response.status_code == 200
    tricep_exercise = tricep_response.json()
    
    # Step 4: Add sets to the bench press
    # Warmup set
    client.post(
        f"/api/v1/templates/{push_template['id']}/exercises/{bench_exercise['id']}/sets",
        json={
            "set_number": 1,
            "target_reps": 10,
            "target_weight": 60.0,
            "is_warmup": True,
            "target_rest_time": 60
        },
        headers=headers
    )
    
    # Working sets for bench press
    for i in range(3):
        client.post(
            f"/api/v1/templates/{push_template['id']}/exercises/{bench_exercise['id']}/sets",
            json={
                "set_number": i+2,
                "target_reps": 8,
                "target_weight": 100.0,
                "is_warmup": False,
                "target_rest_time": 120
            },
            headers=headers
        )
    
    # Add sets to incline dumbbell press
    for i in range(3):
        client.post(
            f"/api/v1/templates/{push_template['id']}/exercises/{incline_exercise['id']}/sets",
            json={
                "set_number": i+1,
                "target_reps": 10,
                "target_weight": 60.0,
                "is_warmup": False,
                "target_rest_time": 90
            },
            headers=headers
        )
    
    # Add sets to overhead press
    for i in range(3):
        client.post(
            f"/api/v1/templates/{push_template['id']}/exercises/{overhead_exercise['id']}/sets",
            json={
                "set_number": i+1,
                "target_reps": 8,
                "target_weight": 40.0,
                "is_warmup": False,
                "target_rest_time": 90
            },
            headers=headers
        )
    
    # Add sets to tricep extension
    for i in range(3):
        client.post(
            f"/api/v1/templates/{push_template['id']}/exercises/{tricep_exercise['id']}/sets",
            json={
                "set_number": i+1,
                "target_reps": 12,
                "target_weight": 30.0,
                "is_warmup": False,
                "target_rest_time": 60
            },
            headers=headers
        )
    
    # Step 5: Create a superset for isolation exercises (overhead press and triceps)
    client.post(
        f"/api/v1/templates/{push_template['id']}/supersets",
        json={
            "exercise_ids": [overhead_exercise['id'], tricep_exercise['id']],
            "orders": [1, 2]
        },
        headers=headers
    )
    
    # Step 6: Create a Pull workout template
    pull_template_response = client.post(
        "/api/v1/templates/",
        json={
            "name": "Pull Workout",
            "description": "Back and biceps workout"
        },
        headers=headers
    )
    assert pull_template_response.status_code == 201
    pull_template = pull_template_response.json()
    
    # Step 7: Add exercises to the Pull template (simplified for brevity)
    barbell_row = next(ex for ex in back_exercises if ex["name"] == "Barbell Row")
    row_response = client.post(
        f"/api/v1/templates/{pull_template['id']}/exercises",
        json={
            "exercise_id": barbell_row["id"],
            "order": 1,
            "notes": "Keep back flat"
        },
        headers=headers
    )
    assert row_response.status_code == 200
    row_exercise = row_response.json()
    
    # Add a few sets
    for i in range(3):
        client.post(
            f"/api/v1/templates/{pull_template['id']}/exercises/{row_exercise['id']}/sets",
            json={
                "set_number": i+1,
                "target_reps": 10,
                "target_weight": 70.0,
                "is_warmup": i == 0,
                "target_rest_time": 90
            },
            headers=headers
        )
    
    # Step 8: Verify templates are created
    templates_response = client.get("/api/v1/templates/", headers=headers)
    assert templates_response.status_code == 200
    templates = templates_response.json()
    assert len(templates) >= 2
    
    # Step 9: Start a Push workout session
    workout_response = client.post(
        "/api/v1/sessions/",
        json={
            "name": "Monday Push Session",
            "template_ids": [push_template["id"]]
        },
        headers=headers
    )
    assert workout_response.status_code == 201
    workout = workout_response.json()
    assert len(workout["exercises"]) >= 4  # Should have all our exercises
    
    # Step 10: Perform the workout - log sets for each exercise
    session_bench = next(ex for ex in workout["exercises"] 
                        if ex["exercise_id"] == bench_press["id"])
    
    # Perform bench press - mark exercise as started
    client.post(
        f"/api/v1/sessions/{workout['id']}/exercises/{session_bench['id']}/start",
        headers=headers
    )
    
    # Log warmup set
    client.post(
        f"/api/v1/sessions/{workout['id']}/exercises/{session_bench['id']}/sets",
        json={
            "set_number": 1,
            "reps_completed": 10,
            "weight": 60.0,
            "is_warmup": True
        },
        headers=headers
    )
    
    # Log working sets with progressive overload
    for i in range(3):
        set_response = client.post(
            f"/api/v1/sessions/{workout['id']}/exercises/{session_bench['id']}/sets",
            json={
                "set_number": i+2,
                "reps_completed": 8,
                "weight": 100.0 + (i * 2.5),  # Progressive overload
                "is_warmup": False,
                "rpe": 8
            },
            headers=headers
        )
        
        # If this isn't the last set, start and end a rest timer
        if i < 2:
            set_data = set_response.json()
            
            # Start rest timer
            rest_start = client.post(
                f"/api/v1/sessions/{workout['id']}/exercises/{session_bench['id']}/sets/{set_data['id']}/rest",
                headers=headers
            )
            assert rest_start.status_code == 200
            
            # Simulate rest time (1 second for test purposes)
            time.sleep(1)
            
            # End rest timer
            rest_end = client.put(
                f"/api/v1/sessions/{workout['id']}/exercises/{session_bench['id']}/sets/{set_data['id']}/rest",
                headers=headers
            )
            assert rest_end.status_code == 200
            assert rest_end.json()["actual_rest_time"] >= 1  # Should have at least 1 second
    
    # Mark bench press as completed
    client.post(
        f"/api/v1/sessions/{workout['id']}/exercises/{session_bench['id']}/complete",
        headers=headers
    )
    
    # For brevity, we'll skip logging all exercises and just complete the workout
    
    # Step 11: Complete the workout
    complete_response = client.post(
        f"/api/v1/sessions/{workout['id']}/complete",
        headers=headers
    )
    assert complete_response.status_code == 200
    completed_workout = complete_response.json()
    assert completed_workout["completed_at"] is not None
    
    # Step 12: Perform more workouts to generate stats data (simulation)
    # For test purposes, we'll simulate doing the same workout multiple times
    # with slightly different performance to generate trend data
    
    # We'll do 3 more workouts over "time"
    for i in range(3):
        # Start a new workout from the same template
        new_session = client.post(
            "/api/v1/sessions/",
            json={
                "name": f"Push Session {i+2}",
                "template_ids": [push_template["id"]]
            },
            headers=headers
        ).json()
        
        # Get the bench press exercise
        session_bench = next(ex for ex in new_session["exercises"] 
                           if ex["exercise_id"] == bench_press["id"])
        
        # Mark as started
        client.post(
            f"/api/v1/sessions/{new_session['id']}/exercises/{session_bench['id']}/start",
            headers=headers
        )
        
        # Log sets with increasing weights to show progress
        progression = 5.0 * (i + 1)  # Progressive overload between workouts
        
        # Log warmup
        client.post(
            f"/api/v1/sessions/{new_session['id']}/exercises/{session_bench['id']}/sets",
            json={
                "set_number": 1,
                "reps_completed": 10,
                "weight": 60.0 + progression/2,
                "is_warmup": True
            },
            headers=headers
        )
        
        # Log working sets
        for j in range(3):
            client.post(
                f"/api/v1/sessions/{new_session['id']}/exercises/{session_bench['id']}/sets",
                json={
                    "set_number": j+2,
                    "reps_completed": 8,
                    "weight": 100.0 + progression + (j * 2.5),  # Progressive overload
                    "is_warmup": False
                },
                headers=headers
            )
        
        # Mark bench press as completed
        client.post(
            f"/api/v1/sessions/{new_session['id']}/exercises/{session_bench['id']}/complete",
            headers=headers
        )
        
        # Complete the workout
        client.post(
            f"/api/v1/sessions/{new_session['id']}/complete",
            headers=headers
        )
    
    # Step 13: Check progress stats
    
    # Get exercise-specific progress
    progress_response = client.get(
        f"/api/v1/stats/exercise/{bench_press['id']}",
        headers=headers
    )
    assert progress_response.status_code == 200
    progress = progress_response.json()
    
    # Verify we have progress data
    assert progress["exercise_name"] == "Bench Press"
    assert progress["personal_record_weight"] is not None
    assert len(progress["volume_over_time"]) > 0
    assert len(progress["max_weight_over_time"]) > 0
    
    # Check muscle group stats
    muscle_response = client.get(
        "/api/v1/stats/muscle-groups",
        headers=headers
    )
    assert muscle_response.status_code == 200
    muscle_stats = muscle_response.json()
    
    # Verify we have muscle group data
    assert len(muscle_stats["muscle_groups"]) > 0
    assert "Chest" in [m["muscle_group"] for m in muscle_stats["muscle_groups"]]
    
    # Check for personal records
    pr_response = client.get(
        "/api/v1/stats/personal-records",
        headers=headers
    )
    assert pr_response.status_code == 200
    pr_data = pr_response.json()
    assert pr_data["total_count"] > 0
    
    # Check workout overview
    overview_response = client.get(
        "/api/v1/stats/overview",
        headers=headers
    )
    assert overview_response.status_code == 200
    overview = overview_response.json()
    assert overview["total_workouts"] >= 4  # We did 4 workouts
    assert overview["total_volume"] > 0
    
    # Check workout trends
    trends_response = client.get(
        "/api/v1/stats/trends?metric=volume&period=weekly",
        headers=headers
    )
    assert trends_response.status_code == 200
    trends = trends_response.json()
    assert trends["metric"] == "volume"
    assert len(trends["data"]) > 0