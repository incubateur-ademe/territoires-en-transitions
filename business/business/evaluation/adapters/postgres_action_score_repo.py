from dataclasses import asdict
import json
from typing import List

from psycopg import errors, Connection

from business.utils.postgres_repo import (
    PostgresRepository,
    PostgresRepositoryError,
)
from business.evaluation.domain.models.action_score import ActionScore
from business.evaluation.domain.ports.action_score_repo import (
    AbstractActionScoreRepository,
)

from business.utils.timeit import timeit


class PostgresActionScoreRepository(AbstractActionScoreRepository, PostgresRepository):
    def __init__(self, connection: Connection) -> None:
        PostgresRepository.__init__(self, connection)

    @timeit("[postgres] add_entities_for_collectivite")
    def add_entities_for_collectivite(
        self, collectivite_id: int, entities: List[ActionScore]
    ):
        if not entities:
            return
        referentiel = entities[0].action_id.split("_")[
            0
        ]  # TODO : WIP, should be in command
        client_scores_json = json.dumps([asdict(score) for score in entities])

        sql = f"insert into client_scores(collectivite_id, referentiel, scores, score_created_at) values({collectivite_id}, '{referentiel}', '{client_scores_json}', now()) on conflict on constraint client_scores_pkey do update set scores='{client_scores_json}', score_created_at=now();"

        try:
            self.cursor.execute(sql)
        except errors.ForeignKeyViolation as error:
            raise PostgresRepositoryError(str(error))
        self.connection.commit()
