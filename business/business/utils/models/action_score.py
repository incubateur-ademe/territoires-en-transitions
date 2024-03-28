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

    point_referentiel: float
    "La valeur de base tel que calculé à partir des markdowns"

    point_fait: float
    "Pour une tache avec un statut fait, est égal au point référentiel"

    point_programme: float
    "Pour une tache avec un statut programmé, est égal au point référentiel"

    point_pas_fait: float
    "Pour une tache avec un statut pas fait, est égal au point référentiel"

    point_non_renseigne: float
    "Pour une tache sans statut, est égal au point référentiel"

    point_potentiel: float
    "Le potentiel est calculé à partir des conséquences de la personnalisation, " \
        "soit point référentiel x facteur de la personnalisation"

    concerne: bool
    "Vrai si la collectivité s'est déclarée comme non concernée pour cette action ou tous ses enfants"

    total_taches_count: int
    "Le nombre de taches d'une action, est égal à 1 si l'action est une tache"

    completed_taches_count: int
    "Le nombre de taches renseignées"

    fait_taches_avancement: float
    "La somme des proportions du fait des tâches, si une tache à un statut fait à 50% equal à 0.5"

    programme_taches_avancement: float
    "La somme des proportions du programme des tâches, si une tache à un statut programmé à 50% est égal à 0.5"

    pas_fait_taches_avancement: float
    "La somme des proportions du pas fait des tâches, si une tache à un statut pas fait à 50% est égal à 0.5"

    pas_concerne_taches_avancement: float
    "La somme du non concerné des tâches. Si une tache est déclarée non concerné, est égal à 1.0"

    desactive: bool
    "Vrai si l'action ou un de ses ancêtres est désactivé du fait de la personnalisation"

    point_potentiel_perso: Optional[float]
    "Le potentiel personnalisé est calculé à partir du potentiel, " \
        "auquel on ajoute le reliquat des points des actions désactivées"

    renseigne: bool
    "Vrai si l'action est renseignée, càd non manquante à la complétion du référentiel. " \
        "Tag défini en fonction du statut de l'action et de celui de ses parents"

