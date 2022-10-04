from typing import Optional
from business.utils.models.actions import ActionId, ActionReferentiel
from business.evaluation.domain.models.action_score import ActionScore


def make_action_score(
    action_id: str,
    point_potentiel: float = 100,
    point_fait: float = 100,
    point_pas_fait: float = 100,
    point_non_renseigne: float = 100,
    point_programme: float = 100,
    point_referentiel: float = 100,
    concerne: bool = True,
    total_taches_count: int = 1,
    completed_taches_count: int = 1,
    fait_taches_avancement: float = 0.0,
    programme_taches_avancement: float = 0.0,
    pas_fait_taches_avancement: float = 0.0,
    pas_concerne_taches_avancement: float = 0.0,
    referentiel: ActionReferentiel = "eci",
    point_potentiel_perso: Optional[float] = None,
    desactive: bool = False,
):
    return ActionScore(
        action_id=ActionId(action_id),
        point_potentiel=point_potentiel,
        point_referentiel=point_referentiel,
        point_fait=point_fait,
        point_pas_fait=point_pas_fait,
        point_non_renseigne=point_non_renseigne,
        point_programme=point_programme,
        concerne=concerne,
        total_taches_count=total_taches_count,
        completed_taches_count=completed_taches_count,
        fait_taches_avancement=fait_taches_avancement,
        programme_taches_avancement=programme_taches_avancement,
        pas_fait_taches_avancement=pas_fait_taches_avancement,
        pas_concerne_taches_avancement=pas_concerne_taches_avancement,
        referentiel=referentiel,
        point_potentiel_perso=point_potentiel_perso,
        desactive=desactive,
    )
