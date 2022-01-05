from typing import List

from psycopg import Cursor, Connection
from psycopg.rows import class_row
from business.evaluation.domain.ports.action_statut_update_event_repo import (
    AbstractActionStatutUpdateEventRepository,
)
from business.utils.postgres_repo import (
    PostgresRepository,
)


from business.core.domain.models.generated.action_statut_update_event_read import (
    ActionStatutUpdateEventRead,
)


class PostgresActionStatutUpdateEventRepo(
    AbstractActionStatutUpdateEventRepository, PostgresRepository
):
    def __init__(self, connection: Connection) -> None:
        PostgresRepository.__init__(self, connection)

    @staticmethod
    def make_cursor(connection: Connection) -> Cursor:
        return connection.cursor(row_factory=class_row(ActionStatutUpdateEventRead))

    def get_unprocessed_events(self) -> List[ActionStatutUpdateEventRead]:
        self.cursor.execute(
            "select * from unprocessed_action_statut_update_event;",
        )
        readings: List[ActionStatutUpdateEventRead] = self.cursor.fetchall()
        return readings
