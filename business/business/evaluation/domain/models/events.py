from dataclasses import dataclass
from typing import List

from business.evaluation.domain.models.action_score import ActionScore
from business.referentiel.domain.models.referentiel import ActionReferentiel
from business.utils.domain_message_bus import (
    DomainEvent,
    DomainFailureEvent,
)


@dataclass
class TriggerNotationForCollectivite(DomainEvent):
    collectivite_id: int


@dataclass
class TriggerNotationForCollectiviteForReferentiel(DomainEvent):
    collectivite_id: int
    referentiel: ActionReferentiel


@dataclass
class ReferentielScoresForCollectiviteComputed(DomainEvent):
    collectivite_id: int
    referentiel: ActionReferentiel
    scores: List[ActionScore]


@dataclass
class ReferentielScoresForCollectiviteComputationFailed(DomainFailureEvent):
    pass


@dataclass
class ScoresForCollectiviteStored(DomainEvent):
    collectivite_id: int


@dataclass
class ScoresStorageForCollectiviteFailed(DomainFailureEvent):
    pass


@dataclass
class RealtimeEventWithWrongFormatObserved(DomainFailureEvent):
    pass


@dataclass
class TriggerPersonnalisationForCollectivite(DomainEvent):
    collectivite_id: int


@dataclass
class PersonnalisationForCollectiviteFailed(DomainFailureEvent):
    pass


@dataclass
class PersonnalisationForCollectiviteStored(DomainEvent):
    collectivite_id: int


@dataclass
class PersonnalisationConsequenceUpdatedForCollectivite(DomainEvent):
    collectivite_id: int
