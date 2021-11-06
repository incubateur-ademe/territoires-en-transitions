from dataclasses import dataclass
from typing import List

from business.domain.models.action_definition import ActionDefinition
from business.domain.models.action_children import ActionChildren
from business.domain.models.action_points import ActionPoints
from business.domain.models.action_score import ActionScore
from business.domain.models.litterals import Referentiel
from business.domain.models.markdown_action_node import MarkdownActionNode


class DomainEvent:
    pass


@dataclass
class DomainFailureEvent(DomainEvent):
    reason: str


@dataclass
class ActionStatusUpdatedForEpci(DomainEvent):
    epci_id: int
    referentiel: Referentiel
    created_at: str


@dataclass
class MarkdownReferentielFolderUpdated(DomainEvent):
    folder_path: str
    referentiel: Referentiel


@dataclass
class MarkdownReferentielFolderParsed(DomainEvent):
    referentiel_node: MarkdownActionNode


@dataclass
class ParseMarkdownReferentielFolderFailed(DomainFailureEvent):  # FAILURE
    pass


@dataclass
class MarkdownReferentielNodeConvertedToEntities(DomainEvent):
    definitions: List[ActionDefinition]
    points: List[ActionPoints]
    children: List[ActionChildren]
    referentiel: Referentiel


@dataclass
class MarkdownReferentielNodeInconsistencyFound(DomainFailureEvent):  # FAILURE
    pass


@dataclass
class ReferentielScoresForEpciComputed(DomainEvent):
    epci_id: int
    referentiel: Referentiel
    scores: List[ActionScore]


@dataclass
class ReferentielScoresForEpciComputationFailed(DomainFailureEvent):
    pass


@dataclass
class ReferentielStored(DomainEvent):
    referentiel: Referentiel


@dataclass
class ReferentielStorageFailed(DomainFailureEvent):
    pass


@dataclass
class ScoresForEpciStored(DomainEvent):
    epci_id: int


@dataclass
class ScoresStorageForEpciFailed(DomainFailureEvent):
    pass


@dataclass
class RealtimeEventWithWrongFormatObserved(DomainFailureEvent):
    pass
