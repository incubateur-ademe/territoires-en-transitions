from dataclasses import dataclass
from typing import Dict, List

from business.domain.models.markdown_action_node import MarkdownActionNode
from business.domain.models.litterals import Referentiel
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
    epci_id: int
    referentiel: Referentiel
    created_at: str


@dataclass
class StoreReferentielEntities(DomainCommand):
    definitions: List[ActionDefinition]
    points: List[ActionPoints]
    children: List[ActionChildren]
    referentiel: Referentiel

    @classmethod
    def from_dict(cls, d: Dict) -> "StoreReferentielEntities":
        return cls(
            referentiel=d["referentiel"],
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
    referentiel: Referentiel
    epci_id: int


@dataclass
class ConvertMarkdownIndicateursToEntities(DomainCommand):
    folder_path: str
