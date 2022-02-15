import abc
import os
from typing import Any, List, Optional

import requests
from requests import Response
import urllib.parse


class SupabaseClient:
    def __init__(self, url: str, key: str) -> None:
        self._url = url
        self._key = key
        self._header = {"ApiKey": key, "Authorization": f"Bearer {key}"}

        self.db = SupabaseDb(self)
        self.rpc = SupabaseRpc(self)

    def _post(
        self, path: str, data: Any, additional_header: Optional[dict] = None
    ) -> Response:
        additional_header = additional_header or {}
        request_header = {**self._header, **additional_header}
        return requests.post(
            self._make_url_from_path(path), data=data, headers=request_header
        )

    def _get(self, path: str, additional_header: Optional[dict] = None) -> Response:
        additional_header = additional_header or {}
        request_header = {**self._header, **additional_header}
        r = requests.get(self._make_url_from_path(path), headers=request_header)
        return r

    def _delete(self, path: str, additional_header: Optional[dict] = None) -> Response:
        additional_header = additional_header or {}
        request_header = {**self._header, **additional_header}
        return requests.delete(self._make_url_from_path(path), headers=request_header)

    def _make_url_from_path(self, path: str) -> str:
        assert path[0] == "/", "Path should start with a ''"
        return f"{self._url}/rest/v1{path}"


class SupabaseDb:
    def __init__(self, supabase_client: SupabaseClient):
        self.supabase_client = supabase_client

    def delete_by(self, table: str, filters: dict) -> None:
        r = self.supabase_client._delete(f"/{table}?{ urllib.parse.urlencode(filters)}")
        self._raise_if_unexpected_status(204, r.status_code)

    def insert_many(self, table: str, rows: List[dict]) -> None:
        r = self.supabase_client._post(f"/{table}", data=rows)
        self._raise_if_unexpected_status(200, r.status_code)

    def insert(self, table: str, row: dict) -> None:
        r = self.supabase_client._post(f"/{table}", data=row)
        self._raise_if_unexpected_status(200, r.status_code)

    def get_all(self, table: str) -> List[dict]:
        r = self.supabase_client._get(
            f"/{table}?select=*", additional_header={"Content-Type": "application/json"}
        )
        self._raise_if_unexpected_status(200, r.status_code)
        r_json = r.json()
        return r_json

    def get_by(self, table: str, filters: dict) -> List[dict]:
        r = self.supabase_client._get(
            f"/{table}?{ urllib.parse.urlencode(filters)}",
            additional_header={"Content-Type": "application/json"},
        )
        self._raise_if_unexpected_status(200, r.status_code)
        r_json = r.json()
        return r_json

    @staticmethod
    def _raise_if_unexpected_status(expected: int, actual: int):
        if actual != expected:
            raise SupabaseError(
                f"Error with status code {actual}, while we expected {expected}."
            )


class SupabaseRpc:
    def __init__(self, supabase_client: SupabaseClient):
        self.supabase_client = supabase_client


class SupabaseError(Exception):
    pass


class SupabaseRepository(abc.ABC):
    def __init__(self, supabase_client: SupabaseClient) -> None:
        self.supabase_client = supabase_client
