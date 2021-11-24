import abc

from psycopg import Cursor
import psycopg


class PostgresRepositoryError(Exception):
    pass


class PostgresRepository(abc.ABC):
    def __init__(self, connection: psycopg.Connection) -> None:
        self.cursor = self.make_cursor(connection)

    @staticmethod
    def make_cursor(connection: psycopg.Connection) -> Cursor:
        return connection.cursor()
