import lark
import pytest
from business.personnalisation.check_regles import find_regles_errors
from business.personnalisation.engine.models import Question

from business.personnalisation.engine.parser import parser

from business.personnalisation.engine.formule_checker import FormuleChecker
from business.referentiel.domain.models.personnalisation import Regle


questions = [
    Question(
        "question_choix",
        "choix",
        ["question_choix_a", "question_choix_b", "question_choix_c"],
    ),
    Question(
        "question_proportion",
        "proportion",
    ),
    Question(
        "question_binaire",
        "binaire",
    ),
]


def test_regle_desactivation_with_correct_choix_succeeds():
    regle_formule = "reponse(question_choix, question_choix_a)"
    assert find_regles_errors([Regle(regle_formule, "desactivation")], questions) == []


def test_regle_desactivation_with_incorrect_output_type_fails():
    regle_formule = "reponse(question_proportion)"
    assert find_regles_errors([Regle(regle_formule, "desactivation")], questions) == [
        "La règle  de type desactivation formulée reponse(question_proportion) n'a pas le bon type de sortie : <class 'float'> au lieu de booléen."
    ]


def test_regle_with_incorrect_choix_fails():
    regle_formule = "reponse(question_choix, question_choix_f)"
    assert find_regles_errors([Regle(regle_formule, "desactivation")], questions) == [
        'Error trying to process rule "reponse_comparison":\n\nL\'id de choix question_choix_f est inconnu pour la question question_choix. Choix possibles : question_choix_a, question_choix_b, question_choix_c'
    ]


def test_regle_choix_with_incorrect_question_id_fails():
    regle_formule = "reponse(question_inconnue, question_inconnue_choix)"
    assert find_regles_errors([Regle(regle_formule, "desactivation")], questions) == [
        'Error trying to process rule "reponse_comparison":\n\nId de question inconnue: question_inconnue.'
    ]


def test_regle_reduction_using_question_of_type_proportion_succeeds():
    regle_formule = "reponse(question_proportion)"
    assert find_regles_errors([Regle(regle_formule, "reduction")], questions) == []


def test_regle_reduction_with_wrong_output_type_fails():
    regle_formule = "reponse(question_choix, question_choix_a)"
    assert find_regles_errors([Regle(regle_formule, "reduction")], questions) == [
        "La règle  de type reduction formulée reponse(question_choix, question_choix_a) n'a pas la bonne sortie : <class 'bool'> au lieu de nombre."
    ]


def test_regle_call_reponse_on_question_of_type_proportion_with_2_args_fails():
    regle_formule = "reponse(question_proportion, choix)"
    assert find_regles_errors([Regle(regle_formule, "desactivation")], questions) == [
        "Error trying to process rule \"reponse_comparison\":\n\nLa question d'id question_proportion est de type proportion, donc la fonction réponse n'attend qu'un argument."
    ]


def test_regle_desactivation_on_question_of_type_binaire_succeeds():
    regle_formule = "reponse(question_binaire, OUI)"
    assert find_regles_errors([Regle(regle_formule, "desactivation")], questions) == []


def test_regle_desactivation_on_question_of_type_binaire_fails_if_wrong_answer():
    regle_formule = "reponse(question_binaire, Ni_Oui_Ni_Non)"
    assert find_regles_errors([Regle(regle_formule, "desactivation")], questions) == [
        'Error trying to process rule "reponse_comparison":\n\nL\'id de choix Ni_Oui_Ni_Non est inconnu pour la question question_binaire. Choix possibles : OUI, NON'
    ]
