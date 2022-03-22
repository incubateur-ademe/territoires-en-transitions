from typing import List

import lark
from business.personnalisation.engine.formule_checker import FormuleChecker

from business.personnalisation.engine.models import Question
from business.personnalisation.engine.parser import parser
from business.referentiel.domain.models.personnalisation import Regle
from business.referentiel.domain.models.question import Question as QuestionReferentiel


def find_regles_errors(regles: List[Regle], questions: List[Question]) -> List[str]:
    """Function to check a regle is correctly defined"""
    formule_checker = FormuleChecker(questions)
    regles_errors = []
    for regle in regles:

        try:
            tree = parser.parse(regle.formule)
            output_type, _ = formule_checker.transform(tree)

            if regle.type == "desactivation":
                assert (
                    output_type == bool
                ), f"La règle {regle.description} de type {regle.type} formulée {regle.formule} n'a pas le bon type de sortie : {output_type} au lieu de booléen."
            else:  # reduction, scores
                assert (
                    output_type == float
                ), f"La règle {regle.description} de type {regle.type} formulée {regle.formule} n'a pas la bonne sortie : {output_type} au lieu de nombre."
        except (lark.exceptions.VisitError, AssertionError) as error:
            regles_errors.append(str(error))
    return regles_errors
