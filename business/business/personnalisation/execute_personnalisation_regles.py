from typing import Dict, List, Optional

from dataclasses import dataclass
from business.personnalisation.engine.formule import ReponseMissing

from business.personnalisation.engine.formule_interpreter import FormuleInterpreter
from business.personnalisation.models import ActionPersonnalisationConsequence, Reponse
from business.personnalisation.engine.regles_parser import ReglesParser
from business.utils.action_id import ActionId


def execute_personnalisation_regles(
    regles_parser: ReglesParser, reponses: List[Reponse]
) -> Dict[ActionId, ActionPersonnalisationConsequence]:
    """Calculate personnalisation given a set of regles and reponses"""
    formule_interpreter = FormuleInterpreter(reponses)
    personnalisation_consequences = {}
    for action_id, parsed_regle in regles_parser.parsed_regles_by_action_id.items():
        desactive = potentiel_perso = None
        if parsed_regle.desactivation:
            try:
                desactive: Optional[bool] = formule_interpreter.visit(
                    parsed_regle.desactivation
                )
            except ReponseMissing:
                pass
        if parsed_regle.reduction:
            try:
                potentiel_perso: Optional[float] = formule_interpreter.visit(
                    parsed_regle.reduction
                )
            except ReponseMissing:
                pass
        personnalisation_consequences[action_id] = ActionPersonnalisationConsequence(
            desactive, potentiel_perso
        )
    return personnalisation_consequences
