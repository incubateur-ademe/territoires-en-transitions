from dataclasses import asdict
from typing import List

from psycopg import errors, Connection

from business.adapters.postgres.postgres_repo import (
    PostgresRepository,
    PostgresRepositoryError,
)
from business.domain.models.action_score import ActionScore
from business.domain.ports.action_score_repo import AbstractActionScoreRepository
from business.domain.models.generated.score_write import ScoreWrite as PgScoreWrite


class PostgresActionScoreRepository(AbstractActionScoreRepository, PostgresRepository):
    def __init__(self, connection: Connection) -> None:
        PostgresRepository.__init__(self, connection)

    def add_entities_for_epci(self, epci_id: int, entities: List[ActionScore]):
        for score in entities:
            score_as_dict = asdict(
                PgScoreWrite(
                    epci_id=epci_id,
                    action_id=score.action_id,
                    completed_taches_count=score.completed_taches_count,
                    total_taches_count=score.total_taches_count,
                    points=score.points,
                    potentiel=score.potentiel,
                    previsionnel=score.previsionnel,
                    referentiel_points=score.referentiel_points,
                    concernee=score.concerne,
                )
            )
            columns = " ,".join(list(score_as_dict.keys()))
            values_to_interpolate = " ,".join(
                [f"%({column})s" for column in score_as_dict.keys()]
            )
            sql = f"insert into score ({columns}) values ({values_to_interpolate});"
            try:
                self.cursor.execute(sql, score_as_dict)
            except errors.ForeignKeyViolation as error:
                raise PostgresRepositoryError(str(error))
