import abc
from pathlib import Path
from typing import List, Optional

from realtime_py import Socket


from business.referentiel.adapters.json_referentiel_repo import (
    JsonReferentielRepository,
)
from business.evaluation.adapters.replay_realtime import ReplayRealtime
from business.evaluation.adapters.supabase_realtime import SupabaseRealtime
from business.core.domain.ports.domain_message_bus import AbstractDomainMessageBus
from business.referentiel.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.evaluation.domain.ports.realtime import (
    AbstractConverter,
    AbstractRealtime,
    EpciActionStatutUpdateConverter,
)
from business.evaluation.domain.ports.action_score_repo import (
    AbstractActionScoreRepository,
    InMemoryActionScoreRepository,
)
from business.evaluation.domain.ports.action_status_repo import (
    AbstractActionStatutRepository,
    InMemoryActionStatutRepository,
)
from business.evaluation.domain.use_cases import *
from business.utils.use_case import UseCase
from .environment_variables import (
    EnvironmentVariables,
    get_env_variables,
)


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

    def get_referentiel_repo(self) -> AbstractReferentielRepository:
        if self.ENV.referentiels_repository == "JSON":
            if self.ENV.referentiels_repo_json is None:
                raise ValueError(
                    "`REFERENTIEL_REPO_JSON` should de specified in mode JSON"
                )
            return JsonReferentielRepository(Path(self.ENV.referentiels_repo_json))
        else:
            raise NotImplementedError(
                f"Referentiels repo adapter {self.ENV.referentiels_repository} not yet implemented."
            )

    def get_scores_repo(self) -> AbstractActionScoreRepository:
        if self.ENV.labelisation_repositories == "IN_MEMORY":
            return InMemoryActionScoreRepository()
        else:
            raise NotImplementedError(
                f"Scores repo adapter {self.ENV.labelisation_repositories} not yet implemented."
            )

    def get_statuts_repo(self) -> AbstractActionStatutRepository:
        if self.ENV.labelisation_repositories == "IN_MEMORY":
            return InMemoryActionStatutRepository()
        else:
            raise NotImplementedError(
                f"Statuts repo adapter {self.ENV.labelisation_repositories} not yet implemented."
            )

    def get_realtime(self, socket: Optional[Socket]) -> AbstractRealtime:

        converters: List[AbstractConverter] = [EpciActionStatutUpdateConverter()]

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
