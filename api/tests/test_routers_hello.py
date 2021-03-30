from fastapi.testclient import TestClient

from api.app import app

client = TestClient(app)


def test_read_main():
    response = client.get("/hello")
    assert response.status_code == 200
    assert response.text == "Hello!"
