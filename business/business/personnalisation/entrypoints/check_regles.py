from typing import List

from business.personnalisation.engine.formule import FormuleChecker, Question
from business.referentiel.domain.models.personnalisation import Regle
from business.personnalisation.engine.parser import parser


def check_regles(regles: List[Regle], questions: List[Question]):
    """Function to check a regle is correctly defined"""
    formule_checker = FormuleChecker(questions)

    for regle in regles:
        tree = parser.parse(regle.formule)
        output_type, _ = formule_checker.transform(tree)
        # ----
        if regle.type == "desactivation":
            assert (
                output_type == bool
            ), f"La règle {regle.description} de type {regle.type} formulée {regle.formule} n'a pas le bon type de sortie : {output_type} au lieu de booléen."
        else:  # reduction, scores
            assert (
                output_type == float
            ), f"La règle {regle.description} de type {regle.type} formulée {regle.formule} n'a pas la bonne sortie : {output_type} au lieu de nombre."
