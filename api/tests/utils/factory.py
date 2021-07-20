from typing import List
from api.models.generated.action_referentiel import ActionReferentiel


def make_action_referentiel(
    id: str = "default_id",
    id_nomenclature: str = "",
    nom: str = "default_nom",
    description: str = "",
    thematique_id: str = "default_thematique_id",
    points: float = 42,
    actions: List[ActionReferentiel] = [],
):
    return ActionReferentiel(
        id=id,
        id_nomenclature=id_nomenclature,
        nom=nom,
        description=description,
        thematique_id=thematique_id,
        points=points,
        actions=actions,
    )
