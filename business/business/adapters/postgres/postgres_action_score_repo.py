from dataclasses import asdict
from typing import List

from psycopg import Cursor

from business.adapters.postgres.postgres_repo import PostgresRepository
from business.domain.models.action_score import ActionScore
from business.domain.ports.action_score_repo import AbstractActionScoreRepository


class PostgresActionScoreRepository(AbstractActionScoreRepository, PostgresRepository):
    def __init__(self, cursor: Cursor) -> None:
        PostgresRepository.__init__(self, cursor)

    def add_entities_for_epci(self, epci_id: int, entities: List[ActionScore]):
        for score in entities:
            score_as_dict = asdict(score)
            columns = ",".join(list(score_as_dict.keys()))
            values = ", ".join([str(x) for x in score_as_dict.values()])
            sql = f"insert into scores({columns}) values ({values});"
            self.cursor.execute(sql)
