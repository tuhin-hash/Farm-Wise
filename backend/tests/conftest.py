import os
import pytest
from fastapi.testclient import TestClient

# Ensure test environment uses test database
os.environ["ENVIRONMENT"] = "testing"
from app.main import app
from app.db.seed import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    seed_database(force=True)

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
