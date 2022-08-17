import abc
from typing import Dict, List
from business.evaluation.domain.models.events import (
    TriggerPersonnalisationForCollectivite,
)

from business.personnalisation.models import (
    ActionPersonnalisationConsequence,
    IdentiteCollectivite,
    Reponse,
)
from business.referentiel.domain.models.personnalisation import (
    ActionPersonnalisationRegles,
)
from business.utils.action_id import ActionId


class AbstractPersonnalisationRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def get_personnalisation_regles(
        self,
    ) -> List[ActionPersonnalisationRegles]:
        raise NotImplementedError

    @abc.abstractmethod
    def get_reponses_for_collectivite(self, collectivite_id: int) -> List[Reponse]:
        raise NotImplementedError

    @abc.abstractmethod
    def get_identite_for_collectivite(
        self, collectivite_id: int
    ) -> IdentiteCollectivite:
        raise NotImplementedError

    @abc.abstractmethod
    def save_action_personnalisation_consequences_for_collectivite(
        self,
        collectivite_id: int,
        action_personnalisation_consequences: Dict[
            ActionId, ActionPersonnalisationConsequence
        ],
    ) -> None:
        raise NotImplementedError

    @abc.abstractmethod
    def get_unprocessed_reponse_events() -> List[
        TriggerPersonnalisationForCollectivite
    ]:
        raise NotImplementedError

    @abc.abstractmethod
    def get_action_personnalisation_consequences_for_collectivite(
        self,
        collectivite_id: int,
    ) -> Dict[ActionId, ActionPersonnalisationConsequence]:
        raise NotImplementedError


class InMemoryPersonnalisationRepository(AbstractPersonnalisationRepository):
    def __init__(self) -> None:
        self._reponses: List[Reponse] = []
        self._action_personnalisation_consequences: Dict[
            ActionId, ActionPersonnalisationConsequence
        ] = {}
        self._action_personnalisation_regles: List[ActionPersonnalisationRegles] = []
        self._unprocessed_reponse_events: List[
            TriggerPersonnalisationForCollectivite
        ] = []
        self._identite = IdentiteCollectivite()

    def get_reponses_for_collectivite(self, collectivite_id: int) -> List[Reponse]:
        return self._reponses

    def get_identite_for_collectivite(
        self, collectivite_id: int
    ) -> IdentiteCollectivite:
        return self._identite

    def save_action_personnalisation_consequences_for_collectivite(
        self,
        collectivite_id: int,
        action_personnalisation_consequences: Dict[
            ActionId, ActionPersonnalisationConsequence
        ],
    ) -> None:
        self._action_personnalisation_consequences = (
            action_personnalisation_consequences
        )

    def get_personnalisation_regles(
        self,
    ) -> List[ActionPersonnalisationRegles]:
        return self._action_personnalisation_regles

    def get_unprocessed_reponse_events(
        self,
    ) -> List[TriggerPersonnalisationForCollectivite]:
        return self._unprocessed_reponse_events

    def get_action_personnalisation_consequences_for_collectivite(
        self,
        collectivite_id: int,
    ) -> Dict[ActionId, ActionPersonnalisationConsequence]:
        return self._action_personnalisation_consequences

    # for test purposes only
    def set_action_personnalisation_regles(
        self,
        action_personnalisation_regles: List[ActionPersonnalisationRegles],
    ) -> None:
        self._action_personnalisation_regles = action_personnalisation_regles

    def set_reponses(self, reponses: List[Reponse]) -> None:
        self._reponses = reponses

    def set_identite(self, identite: IdentiteCollectivite) -> None:
        self._identite = identite

    def set_action_personnalisation_consequences(
        self,
        personnalisation_consequences_by_action_id: Dict[
            ActionId, ActionPersonnalisationConsequence
        ],
    ) -> None:
        self._action_personnalisation_consequences = (
            personnalisation_consequences_by_action_id
        )

    def set_unprocessed_reponse_events(
        self, unprocessed_reponse_events: List[TriggerPersonnalisationForCollectivite]
    ) -> None:
        self._unprocessed_reponse_events = unprocessed_reponse_events
