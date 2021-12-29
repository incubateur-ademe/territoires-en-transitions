from dataclasses import asdict
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
from business.core.domain.models.generated.score_write import (
    ScoreWrite as PgScoreWrite,
)
from business.utils.timeit import timeit


class PostgresActionScoreRepository(AbstractActionScoreRepository, PostgresRepository):
    def __init__(self, connection: Connection) -> None:
        PostgresRepository.__init__(self, connection)

    @timeit("[postgres] add_entities_for_collectivite")
    def add_entities_for_collectivite(
        self, collectivite_id: int, entities: List[ActionScore]
    ):
        for score in entities:
            score_as_dict = asdict(
                PgScoreWrite(
                    collectivite_id=collectivite_id,
                    action_id=score.action_id,
                    completed_taches_count=score.completed_taches_count,
                    total_taches_count=score.total_taches_count,
                    points=score.points,
                    potentiel=score.potentiel,
                    previsionnel=score.previsionnel,
                    referentiel_points=score.referentiel_points,
                    concerne=score.concerne,
                )
            )
            columns = " ,".join(list(score_as_dict.keys()))
            values_to_interpolate = " ,".join(
                [f"%({column})s" for column in score_as_dict.keys()]
            )
            do_update_set = ", ".join(
                [f"{column}=%({column})s" for column in score_as_dict.keys()]
            )

            sql = f"insert into score ({columns}) values ({values_to_interpolate}) on conflict on constraint score_pkey do update set {do_update_set}, created_at = now();"

            try:
                self.cursor.execute(sql, score_as_dict)
            except errors.ForeignKeyViolation as error:
                raise PostgresRepositoryError(str(error))

        try:
            self.cursor.execute(
                f"select insert_client_scores_for_collectivite({collectivite_id});"
            )
        except errors.ForeignKeyViolation as error:
            raise PostgresRepositoryError(str(error))
        self.connection.commit()
