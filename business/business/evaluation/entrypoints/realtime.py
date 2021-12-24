import os
from typing import List, Optional

from realtime_py import Socket

from business.evaluation.domain.models import events
from business.core.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
    InMemoryDomainMessageBus,
)
from business.evaluation.domain.ports.realtime import AbstractRealtime
from business.evaluation.domain.use_cases import *
from business.utils.prepare_bus import EventHandlers, prepare_bus
from business.utils.environment_variables import EnvironmentVariables
from business.utils.config import Config

# 1. Define Handlers
EVENT_HANDLERS: EventHandlers = {
    events.ActionStatutUpdatedForCollectivite: [
        ComputeReferentielScoresForCollectivite
    ],
    events.ReferentielScoresForCollectiviteComputed: [StoreScoresForCollectivite],
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
            ComputeReferentielScoresForCollectivite(
                self.domain_message_bus, self.referentiel_repo, self.statuses_repo
            ),
            StoreScoresForCollectivite(
                self.domain_message_bus, score_repo=self.score_repo
            ),
        ]


def get_config(socket: Optional[Socket]):  # TODO variabilize all instantiations !
    domain_message_bus = InMemoryDomainMessageBus()

    config = EvaluationConfig(
        domain_message_bus,
        socket=socket,
    )
    prepare_bus(config, EVENT_HANDLERS)
    return config


# SUPABASE_ID = ""
# API_KEY = ""
def get_connected_socket() -> Socket:
    SUPABASE_WS = os.getenv("SUPABASE_WS")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    if not SUPABASE_WS or not SUPABASE_KEY:
        raise EnvironmentError("SUPABASE_WS and SUPABASE_KEY should be specified ")

    SUPABASE_URL = (
        f"{SUPABASE_WS}/realtime/v1/websocket?apikey={SUPABASE_KEY}&vsn=1.0.0"
    )
    socket = Socket(SUPABASE_URL)
    socket.connect()
    return socket


# 4. Launch realtime
if __name__ == "__main__":
    socket = get_connected_socket()
    config = get_config(socket)
    config.realtime.start()
    socket.listen()
