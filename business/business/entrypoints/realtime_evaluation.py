from typing import List, Dict, Type

from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
)
from business.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.domain.ports.action_score_repo import (
    AbstractActionScoreRepository,
)
from business.domain.ports.action_status_repo import (
    AbstractActionStatusRepository,
)
from business.domain.ports.data_layer_realtime import (
    AbstractDataLayerRealtime,
)
from realtime_py.connection import Socket

from realtime import Realtime
from realtime.supabase_controller import SupabaseRealtimeController
from business.domain.use_cases import *
from business.domain.models import events, commands
from business.entrypoints.config import Config

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
        data_layer_event_bus: AbstractDataLayerRealtime,
    ) -> None:
        super().__init__(domain_message_bus)
        self.referentiel_repo = referentiel_repo
        self.score_repo = score_repo
        self.statuses_repo = statuses_repo
        self.data_layer_event_bus = data_layer_event_bus

    def prepare_use_cases(self) -> List[UseCase]:

        return [
            ComputeReferentielScoresForEpci(
                self.domain_message_bus, self.referentiel_repo, self.statuses_repo
            ),
            StoreScoresForEpci(self.domain_message_bus, score_repo=self.score_repo),
        ]


# 3. Prepare domain bus


# 4. Launch realtime

# SUPABASE_ID = ""
# API_KEY = ""

if __name__ == "__main__":
    URL = f"ws://{SUPABASE_ID}.supabase.co/realtime/v1/websocket?apikey={API_KEY}&vsn=1.0.0"
    socket = Socket(URL)
    socket.connect()

    controller = SupabaseRealtimeController(socket)
    realtime = Realtime(controller=controller)

    realtime.start()

    realtime.event_source.subscribe(lambda e: print(e))

    socket.listen()
