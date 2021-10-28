from typing import List

from psycopg import Cursor

from data_layer.repositories import EpciRepository
from models.client_epci import ClientEpci


class PostgresRepository:
    def __init__(self, cursor: Cursor, auto_commit=True) -> None:
        super().__init__()
        self.cursor = cursor
        self.auto_commit = auto_commit


class EpciPostgresRepository(PostgresRepository, EpciRepository):
    def list_epci(self) -> List[ClientEpci]:
        self.cursor.execute("select * from client_epci;")
        data = self.cursor.fetchall()
        return [ClientEpci(**d) for d in data]
