from dataclasses import dataclass
from typing import Optional

from business.utils.action_id import ActionId
from business.referentiel.domain.models.referentiel import ActionReferentiel


@dataclass  # TODO : decide how to type this output for client !
class ActionScore:
    action_id: ActionId  # eg.  "eci_1.0"
    point_fait: float
    point_programme: float
    point_pas_fait: float
    point_non_renseigne: float
    point_potentiel: float
    point_referentiel: float
    concerne: bool
    total_taches_count: int
    completed_taches_count: int
    referentiel: ActionReferentiel
    desactive: bool
    point_potentiel_perso: Optional[float]
