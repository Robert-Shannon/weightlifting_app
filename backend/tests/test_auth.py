import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
import os

from src.main import app
from src.core.database.session import get_db, Base
from src.models.user import User

# Setup test database (use PostgreSQL for testing to match your production environment)
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", 
    "postgresql://robertshannon:postgres@localhost:5432/test_weightlifting_app"
)

engine = create_engine(TEST_DATABASE_URL)
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

def test_register_user(client):
    """Test user registration endpoint"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == "Test User"
    assert data["email"] == "test@example.com"
    assert "token" in data

def test_register_duplicate_email(client):
    """Test registering with an email that's already in use"""
    # First create a user
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "First User",
            "email": "duplicate@example.com",
            "password": "password123"
        }
    )
    
    # Try to register again with the same email
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Second User",
            "email": "duplicate@example.com",
            "password": "password456"
        }
    )
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]

def test_login_user(client):
    """Test user login endpoint"""
    # First create a user
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Login Test",
            "email": "login@example.com",
            "password": "password123"
        }
    )
    
    # Now try to login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["email"] == "login@example.com"

def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    # First create a user
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Auth Test",
            "email": "auth@example.com",
            "password": "password123"
        }
    )
    
    # Try to login with wrong password
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "auth@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_get_current_user(client):
    """Test getting current user info"""
    # First create a user and get token
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Current User",
            "email": "current@example.com",
            "password": "password123"
        }
    )
    token = register_response.json()["token"]
    
    # Now try to get current user info
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "current@example.com"
    assert data["name"] == "Current User"

def test_update_user(client):
    """Test updating user info"""
    # First create a user and get token
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Update Test",
            "email": "update@example.com",
            "password": "password123"
        }
    )
    token = register_response.json()["token"]
    
    # Now try to update user info
    response = client.put(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Updated Name",
            "current_password": "password123",
            "new_password": "newpassword456"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    
    # Try logging in with the new password
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "update@example.com",
            "password": "newpassword456"
        }
    )
    assert login_response.status_code == 200