from psycopg import Cursor


class PostgresRepositoryError(Exception):
    pass


class PostgresRepository:
    def __init__(self, cursor: Cursor) -> None:
        self.cursor = cursor
