from typing import List, Optional, Tuple

from business.referentiel.domain.models.action_children import ActionChildren
from business.referentiel.domain.models.action_definition import (
    ActionDefinition,
    ActionCategorie,
    ActionId,
)
from business.referentiel.domain.models.action_computed_point import ActionComputedPoint
from business.referentiel.domain.models.indicateur import (
    Indicateur,
    IndicateurGroup,
    IndicateurId,
)
from business.referentiel.domain.models.referentiel import ActionReferentiel
from business.referentiel.domain.models.markdown_action_node import MarkdownActionNode
from business.utils.action_id import retrieve_referentiel


def make_action_definition(
    action_id: str,
    referentiel: Optional[ActionReferentiel] = None,
    identifiant: str = "",
    nom: str = "",
    description: str = "",
    contexte: str = "",
    exemples: str = "",
    ressources: str = "",
    perimetre_evaluation="",
    reduction_potentiel="",
    points: Optional[float] = None,
    pourcentage: Optional[float] = None,
    categorie: Optional[ActionCategorie] = None,
):
    return ActionDefinition(
        action_id=ActionId(action_id),
        referentiel=referentiel or retrieve_referentiel(ActionId(action_id)),
        identifiant=identifiant,
        nom=nom,
        description=description,
        contexte=contexte,
        exemples=exemples,
        ressources=ressources,
        perimetre_evaluation=perimetre_evaluation,
        reduction_potentiel=reduction_potentiel,
        points=points,
        pourcentage=pourcentage,
        categorie=categorie,
    )


def make_action_points(action_id: str, points: float):
    return ActionComputedPoint(
        action_id=ActionId(action_id),
        value=points,
        referentiel=retrieve_referentiel(ActionId(action_id)),
    )


def make_action_children(action_id: str, children_ids: List[str]):
    return ActionChildren(
        action_id=ActionId(action_id),
        children=[ActionId(child_id) for child_id in children_ids],
        referentiel=retrieve_referentiel(ActionId(action_id)),
    )


def make_markdown_action_node(
    identifiant: str,
    description: Optional[str] = None,
    points: Optional[float] = None,
    pourcentage: Optional[float] = None,
    actions: List[MarkdownActionNode] = [],
    referentiel: ActionReferentiel = "eci",
    categorie: Optional[ActionCategorie] = None,
):
    return MarkdownActionNode(
        identifiant=identifiant,
        referentiel=referentiel,
        points=points,
        pourcentage=pourcentage,
        actions=actions,
        ressources="",
        exemples="",
        description=description or "",
        thematique_id="",
        contexte="",
        nom="",
        categorie=categorie,
    )


def make_indicateur(
    indicateur_id: str,
    description: Optional[str] = None,
    indicateur_group: Optional[IndicateurGroup] = None,
    action_ids: Optional[List[str]] = None,
    valeur_indicateur: Optional[str] = None,
) -> Indicateur:
    return Indicateur(
        indicateur_id=IndicateurId(indicateur_id),
        identifiant="",
        indicateur_group=indicateur_group or "eci",
        nom="",
        unite="",
        action_ids=[ActionId(action_id) for action_id in action_ids]
        if action_ids
        else [],
        description=description or "",
        valeur_indicateur=IndicateurId(valeur_indicateur)
        if valeur_indicateur
        else None
        if valeur_indicateur
        else None,
        obligation_eci=False,
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
    action_ids: List[str], referentiel: ActionReferentiel = "eci"
) -> Tuple[List[ActionChildren], List[ActionDefinition], List[ActionComputedPoint]]:
    definitions = [
        make_action_definition(
            action_id=action_id, identifiant=action_id.split(f"{referentiel}")[-1][1:]
        )
        for action_id in action_ids
    ]
    chidren = [
        make_action_children(action_id=action_id, children_ids=[])
        for action_id in action_ids
    ]
    points = [
        make_action_points(action_id=action_id, points=100) for action_id in action_ids
    ]
    return chidren, definitions, points
