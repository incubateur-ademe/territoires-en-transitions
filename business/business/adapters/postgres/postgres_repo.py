from psycopg import Cursor


class PostgresRepository:
    def __init__(self, cursor: Cursor) -> None:
        self.cursor = cursor
