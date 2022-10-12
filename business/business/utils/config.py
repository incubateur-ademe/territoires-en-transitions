import abc
from typing import List, Optional
import os
from dotenv import load_dotenv

from realtime_py import Socket
from business.evaluation.adapters.supabase_action_score_repo import (
    SupabaseActionScoreRepository,
)
from business.evaluation.adapters.supabase_action_statut_repo import (
    SupabaseActionStatutRepository,
)
from business.evaluation.adapters.supabase_action_statut_update_event_repo import (
    SupabaseActionStatutUpdateEventRepository,
)
from business.evaluation.domain.ports.action_statut_update_event_repo import (
    AbstractActionStatutUpdateEventRepository,
    InMemoryActionStatutUpdateEventRepository,
)
from business.personnalisation.adapters.supabase_personnalisation_repo import (
    SupabasePersonnalisationRepository,
)
from business.personnalisation.ports.personnalisation_repo import (
    AbstractPersonnalisationRepository,
    InMemoryPersonnalisationRepository,
)
from business.evaluation.adapters.supabase_referentiel_repo import (
    SupabaseReferentielRepository,
)
from business.evaluation.adapters.replay_realtime import ReplayRealtime
from business.evaluation.adapters.supabase_realtime import SupabaseRealtime
from business.utils.domain_message_bus import AbstractDomainMessageBus
from business.evaluation.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)

from business.evaluation.domain.ports.realtime import (
    AbstractConverter,
    AbstractRealtime,
    CollectiviteActionStatutUpdateConverter,
    CollectiviteActivationConverter,
    CollectiviteReponseUpdateConverter,
)
from business.evaluation.domain.ports.action_score_repo import (
    AbstractActionScoreRepository,
    InMemoryActionScoreRepository,
)

from business.evaluation.domain.ports.action_status_repo import (
    AbstractActionStatutRepository,
    InMemoryActionStatutRepository,
)
from business.evaluation.domain.evaluation import *
from business.utils.supabase_repo import SupabaseClient
from business.utils.use_case import UseCase
from .environment_variables import (
    EnvironmentVariables,
    get_env_variables,
)

load_dotenv()


class PrepareBusError(Exception):
    pass


class Config:
    def __init__(
        self,
        domain_message_bus: AbstractDomainMessageBus,
        env_variables: Optional[EnvironmentVariables] = None,
    ) -> None:
        self.domain_message_bus = domain_message_bus
        self.ENV = env_variables or get_env_variables()

    @abc.abstractmethod
    def prepare_use_cases(self) -> List[UseCase]:
        raise NotImplementedError

    @staticmethod
    def get_supabase_client() -> SupabaseClient:

        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if url is None or key is None:
            raise EnvironmentError(
                "Missing SUPABASE_URL and/or SUPABASE_KEY env variables. "
            )
        return SupabaseClient(url=url, key=key)

    def get_referentiel_repo(self) -> AbstractReferentielRepository:
        return SupabaseReferentielRepository(self.get_supabase_client())

    def get_personnalisation_repo(self) -> AbstractPersonnalisationRepository:
        if self.ENV.repositories == "IN_MEMORY":
            return InMemoryPersonnalisationRepository()
        elif self.ENV.repositories == "SUPABASE":
            return SupabasePersonnalisationRepository(client=self.get_supabase_client())
        else:
            raise NotImplementedError(
                f"Personnalisation repo adapter {self.ENV.repositories} not yet implemented."
            )

    def get_scores_repo(self) -> AbstractActionScoreRepository:
        if self.ENV.repositories == "IN_MEMORY":
            return InMemoryActionScoreRepository()
        elif self.ENV.repositories == "SUPABASE":
            return SupabaseActionScoreRepository(client=self.get_supabase_client())
        else:
            raise NotImplementedError(
                f"Scores repo adapter {self.ENV.repositories} not yet implemented."
            )

    def get_statuts_repo(self) -> AbstractActionStatutRepository:
        if self.ENV.repositories == "IN_MEMORY":
            return InMemoryActionStatutRepository()
        elif self.ENV.repositories == "SUPABASE":
            return SupabaseActionStatutRepository(client=self.get_supabase_client())
        else:
            raise NotImplementedError(
                f"Statuts repo adapter {self.ENV.repositories} not yet implemented."
            )

    def get_action_statut_update_event_repo(
        self,
    ) -> AbstractActionStatutUpdateEventRepository:
        if self.ENV.repositories == "IN_MEMORY":
            return InMemoryActionStatutUpdateEventRepository()
        elif self.ENV.repositories == "SUPABASE":
            return SupabaseActionStatutUpdateEventRepository(
                client=self.get_supabase_client()
            )
        else:
            raise NotImplementedError(
                f"Statuts repo adapter {self.ENV.repositories} not implemented."
            )

    def get_realtime(self, socket: Optional[Socket]) -> AbstractRealtime:

        converters: List[AbstractConverter] = [
            CollectiviteActionStatutUpdateConverter(),
            CollectiviteReponseUpdateConverter(),
            CollectiviteActivationConverter(),
        ]

        if self.ENV.realtime == "REPLAY":
            return ReplayRealtime(self.domain_message_bus, converters=converters)
        elif self.ENV.realtime == "SUPABASE":
            if not socket:
                raise ValueError(
                    "In SUPABASE realtime mode, you should specify SUPABASE_WS_URL."
                )
            return SupabaseRealtime(
                self.domain_message_bus, converters=converters, socket=socket
            )
        else:
            raise NotImplementedError(
                f"Realtime adapter {self.ENV.realtime} not yet implemented."
            )
