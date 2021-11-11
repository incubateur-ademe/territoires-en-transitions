from dataclasses import dataclass
from typing import Dict, List
from business.domain.models.indicateur import Indicateur

from business.domain.models.markdown_action_node import MarkdownActionNode
from business.domain.models.litterals import Referentiel
from business.domain.models.action_definition import ActionDefinition
from business.domain.models.action_children import ActionChildren
from business.domain.models.action_points import ActionPoints
from business.domain.models.action_score import ActionScore
from business.utils.dataclass_from_dict import dataclass_from_dict


class DomainCommand:  # TODO : consider removing command, that seems to rather complexify...
    @classmethod
    def from_dict(cls, d: dict, use_marshmallow=False) -> "DomainCommand":
        return dataclass_from_dict(cls, d, use_marshmallow=use_marshmallow)


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
class StoreReferentielActions(DomainCommand):
    definitions: List[ActionDefinition]
    points: List[ActionPoints]
    children: List[ActionChildren]
    referentiel: Referentiel

    @classmethod
    def from_dict(cls, d: Dict, use_marshmallow=False) -> "StoreReferentielActions":
        return cls(
            referentiel=d["referentiel"],
            definitions=[
                dataclass_from_dict(ActionDefinition, def_as_dict, use_marshmallow)
                for def_as_dict in d["definitions"]
            ],
            points=[
                dataclass_from_dict(ActionPoints, points_as_dict, use_marshmallow)
                for points_as_dict in d["points"]
            ],
            children=[
                dataclass_from_dict(ActionChildren, child_as_dict, use_marshmallow)
                for child_as_dict in d["children"]
            ],
        )


@dataclass
class StoreReferentielIndicateurs(DomainCommand):
    indicateurs: List[Indicateur]
    referentiel: Referentiel

    @classmethod
    def from_dict(cls, d: Dict) -> "StoreReferentielIndicateurs":
        return cls(
            indicateurs=[Indicateur(**as_dict) for as_dict in d["indicateurs"]],
            referentiel=d["referentiel"],
        )


@dataclass
class StoreScoresForEpci(DomainCommand):
    scores: List[ActionScore]
    referentiel: Referentiel
    epci_id: int


@dataclass
class ParseAndConvertMarkdownIndicateursToEntities(DomainCommand):
    folder_path: str
    referentiel: Referentiel
