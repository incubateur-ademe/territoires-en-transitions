from dataclasses import dataclass
from typing import Optional

from business.utils.models.actions import ActionId, ActionReferentiel


@dataclass
class ActionScore:
    """ Le score d'une action.

    Une action est un nœud de l'arbre constituant le référentiel.
    Son score représente les points obtenus ainsi que la valeur de l'action.
    """

    action_id: ActionId
    "L'id de l'action, ex: eci_1.1"

    point_fait: float
    point_programme: float
    point_pas_fait: float
    point_non_renseigne: float

    point_potentiel: float
    "Le potentiel est calculé à partir des conséquences de la personnalisation, " \
        "soit point référentiel x facteur de la personnalisation"

    point_referentiel: float
    concerne: bool
    total_taches_count: int
    completed_taches_count: int
    fait_taches_avancement: float
    programme_taches_avancement: float
    pas_fait_taches_avancement: float
    pas_concerne_taches_avancement: float
    desactive: bool

    point_potentiel_perso: Optional[float]
    "Le potentiel personnalisé est calculé à partir du potentiel, " \
        "auquel on ajoute le reliquat des points des actions désactivées"

