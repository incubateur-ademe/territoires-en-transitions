import os
import time
from typing import List, Optional

from realtime_py import Socket

from business.evaluation.domain.models import events
from business.evaluation.domain.use_cases.catch_up_unprocessed_reponse_update_event import (
    CatchUpUnprocessedReponseUpdateEvents,
)
from business.evaluation.domain.use_cases.compute_and_store_referentiel_personnalisations_for_collectivite import (
    ComputeAndStoreReferentielPersonnalisationsForCollectivite,
)
from business.evaluation.domain.use_cases.trigger_notation_for_collectivite import (
    TriggerNotationForCollectivite,
)
from business.personnalisation.engine.regles_parser import ReglesParser
from business.utils.domain_message_bus import (
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
    events.TriggerNotationForCollectiviteForReferentiel: [
        ComputeReferentielScoresForCollectivite
    ],
    events.TriggerNotationForCollectivite: [TriggerNotationForCollectivite],
    events.ReferentielScoresForCollectiviteComputed: [StoreScoresForCollectivite],
    events.TriggerPersonnalisationForCollectivite: [
        ComputeAndStoreReferentielPersonnalisationsForCollectivite
    ],
    events.PersonnalisationForCollectiviteStored: [TriggerNotationForCollectivite],
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
        # Instantiate repositories
        self.referentiel_repo = self.get_referentiel_repo()
        self.personnalisation_repo = self.get_personnalisation_repo()
        self.score_repo = self.get_scores_repo()
        self.statuses_repo = self.get_statuts_repo()
        self.action_statut_update_event_repo = (
            self.get_action_statut_update_event_repo()
        )
        # Parse personnalisation regles before starting to avoid parsing the formules online
        action_personnalisation_regles = (
            self.personnalisation_repo.get_personnalisation_regles()
        )
        self.regles_parser = ReglesParser(action_personnalisation_regles)

        self.realtime = self.get_realtime(socket) or realtime

    def prepare_use_cases(self) -> List[UseCase]:
        return [
            ComputeReferentielScoresForCollectivite(
                self.domain_message_bus,
                self.referentiel_repo,
                self.personnalisation_repo,
                self.statuses_repo,
            ),
            StoreScoresForCollectivite(
                self.domain_message_bus, score_repo=self.score_repo
            ),
            ComputeAndStoreReferentielPersonnalisationsForCollectivite(
                self.domain_message_bus,
                personnalisation_repo=self.personnalisation_repo,
                regles_parser=self.regles_parser,
            ),
            TriggerNotationForCollectivite(self.domain_message_bus),
        ]

    def prepare_catch_up_unprocessed_action_status_update_events(self):
        return CatchUpUnprocessedActionStatusUpdateEvents(
            self.domain_message_bus,
            action_statut_update_event_repo=self.action_statut_update_event_repo,
        )

    def prepare_catch_up_unprocessed_reponse_update_events(self):
        return CatchUpUnprocessedReponseUpdateEvents(
            self.domain_message_bus,
            personnalisation_repo=self.personnalisation_repo,
        )


def get_config(socket: Optional[Socket]):  # TODO variabilize all instantiations !
    domain_message_bus = InMemoryDomainMessageBus()

    config = EvaluationConfig(
        domain_message_bus,
        socket=socket,
    )
    prepare_bus(config, EVENT_HANDLERS)
    return config


def get_connected_socket() -> Socket:
    SUPABASE_WS = os.getenv("SUPABASE_WS")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    if not SUPABASE_WS or not SUPABASE_KEY:
        raise EnvironmentError("SUPABASE_WS and SUPABASE_KEY should be specified ")

    SUPABASE_URL = (
        f"{SUPABASE_WS}/realtime/v1/websocket?apikey={SUPABASE_KEY}&vsn=1.0.0"
    )
    print("\nSUPABASE_URL => ", SUPABASE_URL)

    socket = Socket(SUPABASE_URL)
    socket.connect()
    return socket


MAX_RETRIES = 10


def start_realtime(left_retries: int = MAX_RETRIES):

    try:
        socket = get_connected_socket()
        config = get_config(socket)

        # First, launch realtime observer
        config.realtime.start()

        # Then, catch up unprocessed reponse and action status event
        config.prepare_catch_up_unprocessed_reponse_update_events().execute()
        config.prepare_catch_up_unprocessed_action_status_update_events().execute()

        socket.listen()
    except Exception as e:
        if left_retries > 0:
            print("Exception => ", e)
            print("Max retries reached, will raise the exception...")
            raise e

        print("Exception => ", e)
        print("Connection closed. Will try to reconnect in 5 seconds...")
        time.sleep(5)
        start_realtime(left_retries - 1)


# 4. Launch realtime
if __name__ == "__main__":
    start_realtime()
