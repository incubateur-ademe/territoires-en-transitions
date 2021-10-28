from typing import List, Optional

from backend.domain.models.action_children import ActionChildren
from backend.domain.models.action_definition import ActionId
from backend.domain.models.action_points import ActionPoints
from backend.domain.models.litterals import ReferentielId
from backend.utils.markdown_import.markdown_action_node import MarkdownActionNode


def make_action_points(action_id: str, points: float):
    return ActionPoints(action_id=ActionId(action_id), value=points)


def make_action_children(action_id: str, children_ids: List[str]):
    return ActionChildren(
        action_id=ActionId(action_id),
        children_ids=[ActionId(child_id) for child_id in children_ids],
    )


def make_markdown_action_node(
    identifiant: str,
    points: Optional[float] = None,
    percentage: Optional[float] = None,
    children: List[MarkdownActionNode] = [],
    referentiel_id: ReferentielId = "eci",
):
    return MarkdownActionNode(
        identifiant=identifiant,
        referentiel_id=referentiel_id,
        points=points,
        percentage=percentage,
        children=children,
        ressources="",
        exemples="",
        description="",
        thematique_id="",
        contexte="",
        nom="",
    )


def set_markdown_action_node_children_with_points(
    action: MarkdownActionNode, points: List[float]
):
    action.actions = [
        make_markdown_action_node(
            identifiant=f"{action.identifiant}.{k+1}", points=child_points
        )
        for k, child_points in enumerate(points)
    ]
