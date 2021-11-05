import os
from typing import List, Dict, Type, Optional

from realtime_py import Socket

from business.domain.models import events, commands
from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
    InMemoryDomainMessageBus,
)
from business.domain.ports.realtime import AbstractRealtime
from business.domain.use_cases import *
from business.entrypoints.config import Config
from business.entrypoints.prepare_bus import prepare_bus
from business.entrypoints.environment_variables import EnvironmentVariables

# 1. Define Handlers
EVENT_HANDLERS: Dict[Type[events.DomainEvent], List[Type[commands.DomainCommand]]] = {
    events.ActionStatutUpdatedForEpci: [commands.ComputeReferentielScoresForEpci],
    events.ReferentielScoresForEpciComputed: [commands.StoreScoresForEpci],
}

COMMAND_HANDLERS: Dict[Type[commands.DomainCommand], Type[UseCase]] = {
    commands.ComputeReferentielScoresForEpci: ComputeReferentielScoresForEpci,
    commands.StoreScoresForEpci: StoreScoresForEpci,
}


# 2. Define Config
class EvaluationConfig(Config):
    def __init__(
        self,
        domain_message_bus: AbstractDomainMessageBus,
        *,
        socket: Optional[Socket] = None,
        realtime: Optional[AbstractRealtime] = None,
        env_variables: Optional[EnvironmentVariables] = None,
    ) -> None:
        super().__init__(domain_message_bus, env_variables=env_variables)
        self.referentiel_repo = self.get_referentiel_repo()
        self.score_repo = self.get_scores_repo()
        self.statuses_repo = self.get_statuts_repo()
        self.realtime = self.get_realtime(socket) or realtime

    def prepare_use_cases(self) -> List[UseCase]:
        return [
            ComputeReferentielScoresForEpci(
                self.domain_message_bus, self.referentiel_repo, self.statuses_repo
            ),
            StoreScoresForEpci(self.domain_message_bus, score_repo=self.score_repo),
        ]

    # 3. Prepare domain bus


def get_config(socket: Optional[Socket]):  # TODO variabilize all instantiations !
    domain_message_bus = InMemoryDomainMessageBus()

    config = EvaluationConfig(
        domain_message_bus,
        socket=socket,
    )
    prepare_bus(config, EVENT_HANDLERS, COMMAND_HANDLERS)
    return config


def get_connected_socket() -> Optional[Socket]:
    SUPABASE_WS_URL = os.getenv("SUPABASE_WS_URL")
    if not SUPABASE_WS_URL:
        return None
    socket = Socket(SUPABASE_WS_URL)
    socket.connect()
    return socket


# 4. Launch realtime
if __name__ == "__main__":
    socket = get_connected_socket()
    config = get_config(socket)
    config.realtime.start()
    socket.listen()
