from typing import Dict, List, Optional, Union

from business.personnalisation.engine.formule import ReponseMissing
from business.personnalisation.engine.formule_interpreter import ReponsesInterpreter
from business.personnalisation.models import (
    ActionPersonnalisationConsequence,
    IdentiteCollectivite,
    Reponse,
)
from business.personnalisation.engine.regles_parser import ReglesParser
from business.utils.action_id import ActionId


def execute_personnalisation_regles(
    regles_parser: ReglesParser,
    reponses: List[Reponse],
    identite: IdentiteCollectivite,
) -> Dict[ActionId, ActionPersonnalisationConsequence]:
    """Calculate personnalisation given a set of regles and reponses"""
    interpreter = ReponsesInterpreter(reponses, identite)
    personnalisation_consequences = {}
    for action_id, parsed_regle in regles_parser.parsed_regles_by_action_id.items():
        desactive = potentiel_perso = potentiel_perso_formule = None
        if parsed_regle.desactivation:
            try:
                desactive: Optional[bool] = interpreter.visit(
                    parsed_regle.desactivation
                )
            except ReponseMissing:
                pass
        if parsed_regle.reduction:
            try:
                potentiel_perso_as_float_or_formule: Optional[
                    Union[float, str]
                ] = interpreter.visit(parsed_regle.reduction)
                if isinstance(potentiel_perso_as_float_or_formule, str):
                    potentiel_perso_formule = potentiel_perso_as_float_or_formule
                else:
                    potentiel_perso = potentiel_perso_as_float_or_formule
            except ReponseMissing:
                pass
        personnalisation_consequences[action_id] = ActionPersonnalisationConsequence(
            desactive, potentiel_perso, potentiel_perso_formule
        )
    return personnalisation_consequences
