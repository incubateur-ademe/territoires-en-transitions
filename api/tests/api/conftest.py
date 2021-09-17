from typing import Generator

import pytest
from fastapi.testclient import TestClient
from tortoise.contrib.test import finalizer, initializer

from api.app import app
from api.config.database import DB_MODELS


@pytest.fixture(scope="module", autouse=True)
def client() -> Generator:
    initializer(DB_MODELS)
    with TestClient(app) as test_client:
        yield test_client
    finalizer()


@pytest.fixture(scope="module")
def event_loop(client: TestClient) -> Generator:
    yield client.task.get_loop()
