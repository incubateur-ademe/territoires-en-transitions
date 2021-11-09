from typing import List

from psycopg import Cursor, errors

from business.adapters.postgres.postgres_repo import (
    PostgresRepository,
    PostgresRepositoryError,
)
from business.domain.models.litterals import Referentiel
from business.domain.ports.action_status_repo import AbstractActionStatutRepository
from business.domain.models.action_statut import ActionStatut


class PostgresActionStatutRepository(
    AbstractActionStatutRepository, PostgresRepository
):
    def __init__(self, cursor: Cursor) -> None:
        PostgresRepository.__init__(self, cursor)

    def get_all_for_epci(
        self, epci_id: int, referentiel: Referentiel
    ) -> List[ActionStatut]:
        return []
