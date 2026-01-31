from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_verify_forensics():
    response = client.post("/verify/forensics")
    assert response.status_code == 200
    assert response.json() == {"status": "verification started"}
