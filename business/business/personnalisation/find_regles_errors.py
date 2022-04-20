from typing import List


from business.personnalisation.engine.formule_checker import FormuleChecker
from business.personnalisation.models import Question
from business.personnalisation.engine.parser import parser
from business.referentiel.domain.models.personnalisation import Regle
from business.utils.action_id import ActionId


def find_regles_errors(
    regles: List[Regle], questions: List[Question], action_ids: List[ActionId]
) -> List[str]:
    """Function to check a regle is correctly defined"""
    formule_checker = FormuleChecker(questions, action_ids)
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
                assert output_type in [
                    float,
                    str,
                ], f"La règle de type {regle.type} formulée {regle.formule} n'a pas la bonne sortie : {output_type} au lieu de nombre."
        except Exception as error:
            regles_errors.append(
                f"\nErreur dans la régle formulée {regle.formule} : {str(error)}"
            )
    return regles_errors
