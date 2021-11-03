from dataclasses import dataclass
from typing import Dict, List
from business.domain.models.data_layer_events import DataLayerEvent

from business.domain.models.markdown_action_node import MarkdownActionNode
from business.domain.models.litterals import ReferentielId
from business.domain.models.action_definition import ActionDefinition
from business.domain.models.action_children import ActionChildren
from business.domain.models.action_points import ActionPoints
from business.domain.models.action_score import ActionScore


class DomainCommand:  # TODO : consider removing command, that seems to rather complexify...
    pass

    @classmethod
    def from_dict(cls, d: dict) -> "DomainCommand":
        return cls(**d)


@dataclass
class ParseMarkdownReferentielFolder(DomainCommand):
    folder_path: str


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
    referentiel_id: ReferentielId

    @classmethod
    def from_dict(cls, d: Dict) -> "StoreReferentielEntities":
        return cls(
            referentiel_id=d["referentiel_id"],
            definitions=[
                ActionDefinition(**def_as_dict) for def_as_dict in d["definitions"]
            ],
            points=[ActionPoints(**points_as_dict) for points_as_dict in d["points"]],
            children=[
                ActionChildren(**child_as_dict) for child_as_dict in d["children"]
            ],
        )


@dataclass
class StoreScoresForEpci(DomainCommand):
    scores: List[ActionScore]
    referentiel_id: ReferentielId
    epci_id: str


@dataclass
class TransferDataLayerEventToDomain(DomainCommand):
    event: DataLayerEvent
