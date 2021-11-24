from dataclasses import dataclass
from pathlib import Path
from typing import List

from .action_definition import ActionDefinition
from .action_children import ActionChildren
from .action_points import ActionPoints
from business.core.domain.models.referentiel import Referentiel
from business.core.domain.models.event import DomainEvent, DomainFailureEvent
from .markdown_action_node import MarkdownActionNode
from .indicateur import Indicateur


@dataclass
class MarkdownReferentielFolderUpdated(DomainEvent):
    folder_path: str


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
class ReferentielActionsStored(DomainEvent):
    referentiel: Referentiel


@dataclass
class ReferentielIndicateursStored(DomainEvent):
    referentiel: Referentiel


@dataclass
class ReferentielStorageFailed(DomainFailureEvent):
    pass


@dataclass
class IndicateurStored(DomainEvent):
    referentiel: Referentiel


@dataclass
class IndicateurMarkdownConvertedToEntities(DomainEvent):
    indicateurs: List[Indicateur]
    referentiel: Referentiel


@dataclass
class IndicateurMarkdownParsingOrConvertionFailed(DomainFailureEvent):
    pass


@dataclass
class IndicateurEntitiesStored(DomainEvent):
    pass


@dataclass
class ExtractReferentielActionsToCsvTriggered(DomainEvent):
    referentiel: Referentiel
    csv_path: Path


@dataclass
class ParseAndConvertMarkdownIndicateursToEntitiesTriggered(DomainEvent):
    folder_path: str
    referentiel: Referentiel
