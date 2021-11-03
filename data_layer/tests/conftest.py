from urllib.parse import urlparse

import psycopg
import pytest
import supabase
from psycopg import Connection
from supabase.lib.realtime_client import SupabaseRealtimeClient

from fake_layers.business import Business
from fake_layers.client import Client

supabase_project = "dmsgonehoayxxzswrwhc"
supabase_url = f"https://{supabase_project}.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM1MjYwNDUxLCJleHAiOjE5NTA4MzY0NTF9.QOwTz3P0aJZhVrF-jRTBy3PiCDhVvIW8byvHvXqR2dc"
postgres_password = "your-super-secret-and-long-postgres-password"
postgres_url = f"postgresql://postgres:{postgres_password}@localhost:49153/postgres"


@pytest.fixture()
def postgres_connection_params() -> dict:
    db_params = urlparse(postgres_url)

    return dict(
        dbname=db_params.path[1:],
        user=db_params.username,
        password=db_params.password,
        host=db_params.hostname,
        port=db_params.port,
    )


@pytest.fixture()
def postgres_connection(postgres_connection_params) -> Connection:
    return psycopg.connect(**postgres_connection_params)


@pytest.fixture()
def supabase_client() -> supabase.Client:
    """Return the default supabase"""
    # here we use a client with a service role for both client and business layers.
    return supabase.create_client(supabase_url, supabase_key)


@pytest.fixture()
def realtime_client() -> SupabaseRealtimeClient:
    """Return the default supabase"""
    # here we use a client with a service role for both client and business layers.
    realtime_url = f"{supabase_url}/realtime/v1".replace("http", "ws")
    return SupabaseRealtimeClient(realtime_url, {"params": {"apikey": supabase_key}})


@pytest.fixture()
def business(supabase_client) -> Business:
    return Business(supabase_client)


@pytest.fixture()
def app_client(supabase_client) -> Client:
    return Client(supabase_client)
