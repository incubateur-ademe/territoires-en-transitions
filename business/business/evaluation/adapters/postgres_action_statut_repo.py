from typing import List

from psycopg import Cursor, Connection
from psycopg.rows import class_row

from business.utils.postgres_repo import (
    PostgresRepository,
)
from business.core.domain.models.referentiel import Referentiel
from business.evaluation.domain.ports.action_status_repo import (
    AbstractActionStatutRepository,
)
from business.evaluation.domain.models.action_statut import ActionStatut, ActionId
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

    def get_all_for_epci(
        self, epci_id: int, referentiel: Referentiel
    ) -> List[ActionStatut]:
        self.cursor.execute(
            "select * from business_action_statut where epci_id=%(epci_id)s and referentiel=%(referentiel)s;",
            {"epci_id": epci_id, "referentiel": referentiel},
        )
        readings: List[BusinessActionStatutRead] = self.cursor.fetchall()
        return [
            ActionStatut(
                action_id=ActionId(reading.action_id),
                avancement=reading.avancement,
                concerne=reading.concerne,
            )
            for reading in readings
        ]
