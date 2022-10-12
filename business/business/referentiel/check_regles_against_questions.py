from typing import Optional


from business.evaluation.personnalisation.formule_checker import FormuleChecker
from business.evaluation.personnalisation.parser import parser
from .parse_regles import (
    ActionRegles,
    Regle,
)
from .parse_questions import Question


def find_regle_error(regle: Regle, formule_checker: FormuleChecker) -> Optional[str]:
    """Function to check a regle is correctly defined"""
    if regle.type == "score":
        return
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
        return f"\nErreur dans la régle formulée {regle.formule} : {str(error)}"


def check_regles_against_questions(
    actions_regles: list[ActionRegles], questions: list[Question]
) -> Optional[str]:
    """Fonction qui vérifie qu'une liste de ActionPersonnalisationRegles est compatible avec une liste de Question"""
    errors = []
    formule_checker = FormuleChecker(questions)
    for action_regles in actions_regles:
        for regle in action_regles.regles:
            error = find_regle_error(regle, formule_checker)
            if error:
                errors.append(error)
    if errors:
        raise Exception(
            f"Incompatiblité dans les formulations des questions et des régles : {', '.join(errors)}"
        )
