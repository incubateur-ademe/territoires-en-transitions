# mypy: no-disallow-untyped-decorators
# pylint: disable=E0611
import asyncio
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from tortoise.contrib.test import finalizer, initializer

from app import app
from config.database import DB_MODELS
from models.tortoise.action_custom import ActionCustom


@pytest.fixture(scope="module")
def client() -> Generator:
    initializer(DB_MODELS)
    with TestClient(app) as c:
        yield c
    finalizer()


@pytest.fixture(scope="module")
def event_loop(client: TestClient) -> Generator:
    yield client.task.get_loop()


def test_create_user(client: TestClient, event_loop: asyncio.AbstractEventLoop):  # nosec
    response = client.post("/action_custom/v1/", json=custom_action)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["epci_id"] == "test"
    assert "uid" in data
    uid = data["uid"]

    async def get_by_db():
        user = await ActionCustom.get(uid=uid)
        return user

    user_obj = event_loop.run_until_complete(get_by_db())
    assert user_obj.id == uid


custom_action = {
    "uid": "b836d2b4-49c3-4c07-ae5c-5374fae78e0c",
    "epci_id": "test",
    "mesure_id": "5d4e1246-47ff-410a-9b5b-baa65d2822e9",
    "name": "omg",
    "description": "such action!"
}
