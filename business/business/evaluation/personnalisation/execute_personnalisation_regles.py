from typing import Dict, List, Optional, Union

from business.evaluation.personnalisation.formule import ReponseMissing
from business.evaluation.personnalisation.formule_interpreter import (
    ReponsesInterpreter,
)
from business.utils.models.personnalisation import ActionPersonnalisationConsequence
from business.utils.models.identite import IdentiteCollectivite
from .regles_parser import ReglesParser
from business.utils.models.actions import ActionId
from business.utils.models.reponse import Reponse


def execute_personnalisation_regles(
    regles_parser: ReglesParser,
    reponses: List[Reponse],
    identite: IdentiteCollectivite,
) -> Dict[ActionId, ActionPersonnalisationConsequence]:
    """Calculate personnalisation given a set of regles and reponses"""
    interpreter = ReponsesInterpreter(reponses, identite)
    personnalisation_consequences = {}
    for action_id, parsed_regle in regles_parser.parsed_regles_by_action_id.items():
        desactive = potentiel_perso = score_override_formule = None
        if parsed_regle.desactivation:
            try:
                desactive: Optional[bool] = interpreter.visit(
                    parsed_regle.desactivation
                )
            except ReponseMissing:
                pass
        if parsed_regle.reduction:
            try:
                potentiel_perso: Optional[Union[str, float]] = interpreter.visit(
                    parsed_regle.reduction
                )
            except ReponseMissing:
                pass
        if parsed_regle.score:
            score_override_formule = interpreter.visit(parsed_regle.score)

        personnalisation_consequences[action_id] = ActionPersonnalisationConsequence(
            desactive, potentiel_perso, score_override_formule
        )
    return personnalisation_consequences
