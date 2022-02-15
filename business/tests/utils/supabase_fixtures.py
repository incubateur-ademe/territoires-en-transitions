import os
from dotenv import load_dotenv
import pytest

from business.utils.supabase_repo import SupabaseClient

load_dotenv()
test_postgres_url = os.getenv("POSTGRES_URL", "missing_postgres_url")


@pytest.fixture()
def supabase_client() -> SupabaseClient:
    url: str = os.getenv("SUPABASE_URL", "missing_supabase_url")
    key: str = os.getenv("SUPABASE_KEY", "missing_supabase_key")
    return SupabaseClient(
        url=url,
        key=key,
    )
