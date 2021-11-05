from typing import List, Dict, Type
from pathlib import Path

from business.domain.ports.realtime import AbstractRealtime
from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
    InMemoryDomainMessageBus,
)

from business.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.domain.ports.action_score_repo import (
    AbstractActionScoreRepository,
    InMemoryActionScoreRepository,
)
from business.domain.ports.action_status_repo import (
    AbstractActionStatusRepository,
    InMemoryActionStatusRepository,
)
from business.entrypoints.prepare_bus import prepare_bus
from business.domain.use_cases import *
from business.domain.models import events, commands
from business.entrypoints.config import Config
from business.adapters.json_referentiel_repo import JsonReferentielRepository
from business.adapters.replay_realtime import ReplayRealtime

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
            # TransferRealtimeEventToDomain(self.domain_message_bus),
            ComputeReferentielScoresForEpci(
                self.domain_message_bus, self.referentiel_repo, self.statuses_repo
            ),
            StoreScoresForEpci(self.domain_message_bus, score_repo=self.score_repo),
        ]

    # 3. Prepare domain bus


def get_config():  # TODO variabilize all instantiations !
    domain_message_bus = InMemoryDomainMessageBus()
    referentiel_repo = JsonReferentielRepository(
        Path("./data/referentiel_repository.json")
    )
    statuses_repo = InMemoryActionStatusRepository()
    scores_repo = InMemoryActionScoreRepository()

    realtime = realtime = ReplayRealtime(
        domain_message_bus,
        json_path=Path("business/adapters/data/epci_action_statut_update.json"),
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

if __name__ == "__main__":
    # URL = f"ws://{SUPABASE_ID}.supabase.co/realtime/v1/websocket?apikey={API_KEY}&vsn=1.0.0"
    # socket = Socket(URL)
    # socket.connect()

    # controller = SupabaseRealtimeController(socket)
    # realtime = Realtime(controller=controller)

    config = get_config()

    # realtime.observe(topic="epci_action_statut_update", callback=lambda e: print(e))

    # realtime.observe(
    #     topic="epci_action_statut_update", callback=lambda e: config.domain_message_bus
    # )

    config.realtime.start()

    # socket.listen()
