from dataclasses import dataclass
from typing import Literal, NewType, Optional


# Literals
# ---------
ActionCategorie = Literal["bases", "mise en œuvre", "effets"]
ActionReferentiel = Literal["cae", "eci"]


ActionId = NewType("ActionId", str)


def build_action_id(referentiel: ActionReferentiel, identifiant: str) -> ActionId:
    if identifiant == "":
        return ActionId(referentiel)
    return ActionId(f"{referentiel}_{identifiant}")


@dataclass
class ActionDefinition:
    action_id: ActionId
    referentiel: ActionReferentiel
    identifiant: str
    nom: str
    description: str
    contexte: str
    exemples: str
    ressources: str
    perimetre_evaluation: str
    reduction_potentiel: str
    md_points: Optional[float]
    md_pourcentage: Optional[float]
    computed_points: Optional[float]
    categorie: Optional[ActionCategorie]


@dataclass
class ActionChildren:
    referentiel: ActionReferentiel  # eg. "eci_2022"
    action_id: ActionId  # eg. "eci_1.1"
    children: list[ActionId]  # ["eci_1.1.1", "eci_1.1.2"]


@dataclass
class ActionComputedPoint:
    referentiel: ActionReferentiel
    action_id: ActionId
    value: float
