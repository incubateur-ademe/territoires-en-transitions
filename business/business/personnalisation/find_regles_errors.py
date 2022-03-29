from typing import List


from business.personnalisation.engine.formule_checker import FormuleChecker
from business.personnalisation.models import Question
from business.personnalisation.engine.parser import parser
from business.referentiel.domain.models.personnalisation import Regle

# TODO : eventually use RegleParser instead of parsing here ?
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
                ), f"La règle de type {regle.type} formulée {regle.formule} n'a pas le bon type de sortie : {output_type} au lieu de booléen."
            else:  # reduction, scores
                assert (
                    output_type == float
                ), f"La règle de type {regle.type} formulée {regle.formule} n'a pas la bonne sortie : {output_type} au lieu de nombre."
        except Exception as error:
            regles_errors.append(
                f"\nErreur dans la régle formulée {regle.formule} : {str(error)}"
            )
    return regles_errors
