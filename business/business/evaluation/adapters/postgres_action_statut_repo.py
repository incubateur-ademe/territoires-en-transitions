from typing import List

from psycopg import Cursor, Connection
from psycopg.rows import class_row

from business.utils.postgres_repo import (
    PostgresRepository,
)
from business.core.domain.models.referentiel import ActionReferentiel
from business.evaluation.domain.ports.action_status_repo import (
    AbstractActionStatutRepository,
)
from business.evaluation.domain.models.action_statut import (
    ActionStatut,
    ActionId,
    ActionStatutAvancement,
)
from business.core.domain.models.generated.business_action_statut_read import (
    BusinessActionStatutRead,
)


class PostgresActionStatutRepository(
    AbstractActionStatutRepository, PostgresRepository
):
    def __init__(self, connection: Connection) -> None:
        PostgresRepository.__init__(self, connection)

    @staticmethod
    def make_cursor(connection: Connection) -> Cursor:
        return connection.cursor(row_factory=class_row(BusinessActionStatutRead))

    def get_all_for_collectivite(
        self, collectivite_id: int, referentiel: ActionReferentiel
    ) -> List[ActionStatut]:
        self.cursor.execute(
            "select * from business_action_statut where collectivite_id=%(collectivite_id)s and referentiel=%(referentiel)s;",
            {"collectivite_id": collectivite_id, "referentiel": referentiel},
        )
        readings: List[BusinessActionStatutRead] = self.cursor.fetchall()
        return [
            ActionStatut(
                action_id=ActionId(reading.action_id),
                avancement=ActionStatutAvancement(reading.avancement),
                concerne=reading.concerne,
            )
            for reading in readings
        ]
