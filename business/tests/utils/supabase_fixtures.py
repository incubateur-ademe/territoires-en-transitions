import os
from dotenv import load_dotenv
import pytest

# from supabase.client import Client, create_client
from supabase_client import Client

load_dotenv()
test_postgres_url = os.getenv("POSTGRES_URL", "missing_postgres_url")


@pytest.fixture()
def supabase_client() -> Client:
    url: str = os.getenv("SUPABASE_TEST_URL", "missing_supabase_test_url")
    key: str = os.getenv("SUPABASE_TEST_KEY", "missing_supabase_test_key")
    # return create_client(url, key)
    return Client(
        api_url=url,
        api_key=key,
        headers={
            # Though this is already taken cared of.
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
    )
