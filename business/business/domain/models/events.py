from dataclasses import dataclass
from typing import List

from business.domain.models.action_definition import ActionDefinition
from business.domain.models.action_children import ActionChildren
from business.domain.models.action_points import ActionPoints
from business.domain.models.action_score import ActionScore
from business.domain.models.litterals import ReferentielId
from business.domain.models.markdown_action_node import MarkdownActionNode


class DomainEvent:
    pass


@dataclass
class DomainFailureEvent(DomainEvent):
    reason: str


@dataclass
class ActionStatusUpdated(DomainEvent):
    epci_id: str
    referentiel_id: ReferentielId


@dataclass
class MarkdownReferentielFolderUpdated(DomainEvent):
    folder_path: str
    referentiel_id: ReferentielId


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

@dataclass
class FoundMarkdownReferentielNodeInconsistency(DomainFailureEvent):  # FAILURE
    pass


@dataclass
class ReferentielScoresForEpciComputed(DomainEvent):
    epci_id: str
    referentiel_id: ReferentielId
    scores: List[ActionScore]