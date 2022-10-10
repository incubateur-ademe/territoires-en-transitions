from typing import List, Optional

from business.utils.models.actions import (
    ActionChildren,
    ActionComputedPoint,
    ActionDefinition,
    ActionCategorie,
    ActionId,
    ActionReferentiel,
)
from business.referentiel.convert_actions import MarkdownActionTree


def _retrieve_referentiel(action_id: str) -> ActionReferentiel:
    return action_id.split("_")[0]  # type: ignore


def _retrieve_identifiant(action_id: str) -> str:
    return action_id.split("_")[1] if "_" in action_id else ""


def make_action_definition(
    action_id: str,
    computed_points: float,
    referentiel: ActionReferentiel = "eci",
    nom: str = "",
    description: str = "",
    contexte: str = "",
    exemples: str = "",
    ressources: str = "",
    perimetre_evaluation="",
    reduction_potentiel="",
    md_points: Optional[float] = None,
    md_pourcentage: Optional[float] = None,
    categorie: Optional[ActionCategorie] = None,
):
    return ActionDefinition(
        action_id=ActionId(action_id),
        referentiel=referentiel or _retrieve_referentiel(ActionId(action_id)),
        identifiant=_retrieve_identifiant(action_id),
        nom=nom,
        description=description,
        contexte=contexte,
        exemples=exemples,
        ressources=ressources,
        perimetre_evaluation=perimetre_evaluation,
        reduction_potentiel=reduction_potentiel,
        md_points=md_points,
        md_pourcentage=md_pourcentage,
        computed_points=computed_points,
        categorie=categorie,
    )


def make_action_children(action_id: str, children_ids: List[str]):
    return ActionChildren(
        action_id=ActionId(action_id),
        children=[ActionId(child_id) for child_id in children_ids],
        referentiel=_retrieve_referentiel(action_id),
    )


def make_markdown_action_tree(
    identifiant: str,
    description: Optional[str] = None,
    points: Optional[float] = None,
    pourcentage: Optional[float] = None,
    actions: List[MarkdownActionTree] = [],
    referentiel: ActionReferentiel = "eci",
    categorie: Optional[ActionCategorie] = None,
):
    return MarkdownActionTree(
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


def make_action_points(action_id: str, points: float):
    return ActionComputedPoint(
        action_id=ActionId(action_id),
        value=points,
        referentiel=_retrieve_referentiel(ActionId(action_id)),
    )
