from typing import List, Optional, Tuple

from business.domain.models.action_children import ActionChildren
from business.domain.models.action_definition import ActionDefinition, ActionId
from business.domain.models.action_points import ActionPoints
from business.domain.models.litterals import Referentiel
from business.domain.models.markdown_action_node import MarkdownActionNode
from business.utils.action_id import retrieve_referentiel


def make_action_definition(
    action_id: str,
    referentiel: Optional[Referentiel] = None,
    identifiant: str = "",
    nom: str = "",
    thematique_id: str = "",
    description: str = "",
    contexte: str = "",
    exemples: str = "",
    ressources: str = "",
    points: Optional[float] = None,
    pourcentage: Optional[float] = None,
):
    return ActionDefinition(
        action_id=ActionId(action_id),
        referentiel=referentiel or retrieve_referentiel(ActionId(action_id)),
        identifiant=identifiant,
        nom=nom,
        thematique_id=thematique_id,
        description=description,
        contexte=contexte,
        exemples=exemples,
        ressources=ressources,
        points=points,
        pourcentage=pourcentage,
    )


def make_action_points(action_id: str, points: float):
    return ActionPoints(
        action_id=ActionId(action_id),
        value=points,
        referentiel=retrieve_referentiel(ActionId(action_id)),
    )


def make_action_children(action_id: str, children_ids: List[str]):
    return ActionChildren(
        action_id=ActionId(action_id),
        children_ids=[ActionId(child_id) for child_id in children_ids],
        referentiel=retrieve_referentiel(ActionId(action_id)),
    )


def make_markdown_action_node(
    identifiant: str,
    points: Optional[float] = None,
    pourcentage: Optional[float] = None,
    actions: List[MarkdownActionNode] = [],
    referentiel: Referentiel = "eci",
):
    return MarkdownActionNode(
        identifiant=identifiant,
        referentiel=referentiel,
        points=points,
        pourcentage=pourcentage,
        actions=actions,
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


def make_dummy_referentiel(
    action_ids: List[str],
) -> Tuple[List[ActionChildren], List[ActionDefinition], List[ActionPoints]]:
    definitions = [
        make_action_definition(action_id=action_id) for action_id in action_ids
    ]
    chidren = [
        make_action_children(action_id=action_id, children_ids=[])
        for action_id in action_ids
    ]
    points = [
        make_action_points(action_id=action_id, points=100) for action_id in action_ids
    ]
    return chidren, definitions, points
