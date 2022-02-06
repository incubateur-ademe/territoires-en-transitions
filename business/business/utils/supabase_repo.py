import abc
from supabase.client import Client


class SupabaseError(Exception):
    pass


class SupabaseRepository(abc.ABC):
    def __init__(self, supabase_client: Client) -> None:
        self.supabase_client = supabase_client
