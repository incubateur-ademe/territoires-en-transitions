import os
from pathlib import Path
from typing import List, Dict, Type, Optional

from realtime_py import Socket

from business.adapters.json_referentiel_repo import JsonReferentielRepository
from business.adapters.supabase_realtime import SupabaseRealtime
from business.domain.models import events, commands
from business.domain.ports.action_score_repo import (
    AbstractActionScoreRepository,
    InMemoryActionScoreRepository,
)
from business.domain.ports.action_status_repo import (
    AbstractActionStatusRepository,
    InMemoryActionStatusRepository,
)
from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
    InMemoryDomainMessageBus,
)
from business.domain.ports.realtime import (
    AbstractRealtime,
    EpciActionStatutUpdateConverter,
    AbstractConverter,
)
from business.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.domain.use_cases import *
from business.entrypoints.config import Config
from business.entrypoints.prepare_bus import prepare_bus

# 1. Define Handlers
EVENT_HANDLERS: Dict[Type[events.DomainEvent], List[Type[commands.DomainCommand]]] = {
    events.ActionStatusUpdatedForEpci: [commands.ComputeReferentielScoresForEpci],
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
        referentiel_repo: AbstractReferentielRepository,
        score_repo: AbstractActionScoreRepository,
        statuses_repo: AbstractActionStatusRepository,
        domain_message_bus: AbstractDomainMessageBus,
        realtime: AbstractRealtime,
    ) -> None:
        super().__init__(domain_message_bus)
        self.referentiel_repo = referentiel_repo
        self.score_repo = score_repo
        self.statuses_repo = statuses_repo
        self.realtime = realtime

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

    referentiel_repo = JsonReferentielRepository(
        Path("./data/referentiel_repository.json")
    )
    statuses_repo = InMemoryActionStatusRepository()
    scores_repo = InMemoryActionScoreRepository()

    # If REALTIME == "REPLAY"
    # realtime = ReplayRealtime(
    # domain_message_bus,
    # json_path=Path("business/adapters/data/epci_action_statut_update.json"),
    # )

    # IF REALIME == "SUPABASE" and socket
    if not socket:
        raise ValueError(
            "In SUPABASE realtime mode, you should specify SUPABASE_WS_URL."
        )
    converters: List[AbstractConverter] = [EpciActionStatutUpdateConverter()]
    realtime = SupabaseRealtime(
        domain_message_bus=domain_message_bus, socket=socket, converters=converters
    )
    config = EvaluationConfig(
        referentiel_repo,
        scores_repo,
        statuses_repo,
        domain_message_bus,
        realtime,
    )
    prepare_bus(config, EVENT_HANDLERS, COMMAND_HANDLERS)
    return config


# 4. Launch realtime

# SUPABASE_ID = ""
# API_KEY = ""
def get_connected_socket() -> Optional[Socket]:
    # SUPABASE_WS_URL = os.getenv("SUPABASE_WS_URL")
    SUPABASE_WS_URL = (
        "wss://kpgbvabtmaarclkhqipm.supabase.co/realtime/v1/websocket?apikey"
        "nope"
        "&vsn=1.0.0"
    )
    if not SUPABASE_WS_URL:
        return None
    socket = Socket(SUPABASE_WS_URL)
    socket.connect()
    return socket


if __name__ == "__main__":
    socket = get_connected_socket()
    config = get_config(socket)
    config.realtime.start()
    socket.listen()
