from dataclasses import dataclass
from typing import List

from backend.domain.models.action_definition import ActionDefinition
from backend.domain.models.action_children import ActionChildren
from backend.domain.models.action_points import ActionPoints
from backend.domain.models.litterals import ReferentielId
from backend.domain.models.markdown_action_node import MarkdownActionNode


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
class ConvertMarkdownReferentielNodeToEntitiesFailed(DomainFailureEvent):  # FAILURE
    pass


@dataclass
class MarkdownReferentielNodeConvertedToEntities(DomainEvent):
    definitions: List[ActionDefinition]
    points: List[ActionPoints]
    children: List[ActionChildren]
