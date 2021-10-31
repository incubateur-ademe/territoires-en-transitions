from dataclasses import dataclass
from typing import List

from business.domain.models.markdown_action_node import MarkdownActionNode
from business.domain.models.litterals import ReferentielId
from business.domain.models.action_definition import ActionDefinition
from business.domain.models.action_children import ActionChildren
from business.domain.models.action_points import ActionPoints
from business.domain.models.action_score import ActionScore

class DomainCommand:
    pass


@dataclass
class ParseMarkdownReferentielFolder(DomainCommand):
    folder_path: str
    referentiel_id: ReferentielId


@dataclass
class ConvertMarkdownReferentielNodeToEntities(DomainCommand):
    referentiel_node: MarkdownActionNode

@dataclass
class ComputeReferentielScoresForEpci(DomainCommand):
    epci_id: str
    referentiel_id: ReferentielId

@dataclass
class StoreReferentielEntities(DomainCommand):
    definitions: List[ActionDefinition]
    points: List[ActionPoints]
    children: List[ActionChildren]
    referentiel_id: ReferentielId # TODO : decide who's responsible of this field

@dataclass
class StoreScoresForEpci(DomainCommand):
    scores: List[ActionScore]
    referentiel_id: ReferentielId
    epci_id: str