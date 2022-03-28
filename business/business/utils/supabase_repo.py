import abc
import json
from typing import Any, List, Optional, Union
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
        self,
        path: str,
        data: Optional[Any] = None,
        additional_header: Optional[dict] = None,
    ) -> Response:
        additional_header = additional_header or {}
        request_header = {**self._header, **additional_header}
        return requests.post(
            self._make_url_from_path(path),
            data=json.dumps(data),
            headers=request_header,
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
    def __init__(self, client: SupabaseClient):
        self.client = client

    def delete_by(self, table: str, filters: dict) -> None:
        r = self.client._delete(f"/{table}?{ urllib.parse.urlencode(filters)}")
        _raise_if_unexpected_status([204], r)

    def insert_many(self, table: str, rows: List[dict], merge_duplicates=False) -> None:
        r = self.client._post(
            f"/{table}",
            data=rows,
            additional_header={"Prefer": "resolution=merge-duplicates"}
            if merge_duplicates
            else None,
        )
        _raise_if_unexpected_status(201, r)

    def insert(self, table: str, row: dict, merge_duplicates=False) -> None:
        r = self.client._post(
            f"/{table}",
            data=row,
            additional_header={"Prefer": "resolution=merge-duplicates"},
        )
        _raise_if_unexpected_status(201, r)

    def get_all(self, table: str) -> List[dict]:
        r = self.client._get(
            f"/{table}?select=*", additional_header={"Content-Type": "application/json"}
        )
        _raise_if_unexpected_status(200, r)
        r_json = r.json()
        return r_json

    def get_by(self, table: str, filters: dict) -> List[dict]:
        r = self.client._get(
            f"/{table}?{ urllib.parse.urlencode(filters)}",
            additional_header={"Content-Type": "application/json"},
        )
        _raise_if_unexpected_status(200, r)
        r_json = r.json()
        return r_json


def _raise_if_unexpected_status(
    expected_status_code: Union[int, List[int]], r: Response
):
    list_expected_status_code = (
        expected_status_code
        if isinstance(expected_status_code, list)
        else [expected_status_code]
    )
    actual_status_code = r.status_code
    if actual_status_code not in list_expected_status_code:
        breakpoint()
        raise SupabaseError(
            f"Error with status code {actual_status_code}, while we expected one of {list_expected_status_code}.\nReason is : {r.reason}",
            r,
        )


class SupabaseRpc:
    def __init__(self, client: SupabaseClient):
        self.client = client

    def call(self, name: str, **kwargs) -> None:
        r = self.client._post(
            f"/rpc/{name}",
            data=kwargs or None,
            additional_header={"Content-Type": "application/json"},
        )
        _raise_if_unexpected_status([200, 204], r)


class SupabaseError(Exception):
    pass


class SupabaseRepository(abc.ABC):
    def __init__(self, client: SupabaseClient) -> None:
        self.client = client
