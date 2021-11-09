from dataclasses import asdict
from typing import List

from psycopg import Cursor, errors

from business.adapters.postgres.postgres_repo import (
    PostgresRepository,
    PostgresRepositoryError,
)
from business.domain.models.action_score import ActionScore
from business.domain.ports.action_score_repo import AbstractActionScoreRepository


class PostgresActionScoreRepository(AbstractActionScoreRepository, PostgresRepository):
    def __init__(self, cursor: Cursor) -> None:
        PostgresRepository.__init__(self, cursor)

    def add_entities_for_epci(self, epci_id: int, entities: List[ActionScore]):
        for score in entities:
            score_as_dict = asdict(score)

            columns = " ,".join(list(score_as_dict.keys()))
            values_to_interpolate = " ,".join(
                [f"%({column})s" for column in score_as_dict.keys()]
            )
            sql = f"insert into score({columns}) values ({values_to_interpolate});"
            try:
                self.cursor.execute(sql, score_as_dict)
            except errors.ForeignKeyViolation as reason:
                PostgresRepositoryError(str(reason))
