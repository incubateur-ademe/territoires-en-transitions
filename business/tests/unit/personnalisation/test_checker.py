import lark
import pytest

from business.personnalisation.engine.parser import parser
from business.personnalisation.engine.formule import (
    Question,
)
from business.personnalisation.engine.formule_checker import FormuleChecker


def test_function_reponse_on_correct_question_type_choix():
    tree = parser.parse("reponse(question_choix_1, question_choix_1a)")

    questions = [
        Question(
            "question_choix_1",
            "choix",
            ["question_choix_1a", "question_choix_1b", "question_choix_1c"],
        )
    ]
    assert FormuleChecker(questions).transform(tree) == (bool, "reponse")


def test_function_reponse_on_question_type_choix_incorrect_question_id():
    tree = parser.parse("reponse(question_choix_1, question_choix_1a)")
    with pytest.raises(lark.exceptions.VisitError) as error:
        FormuleChecker([]).transform(tree)
    assert (
        str(error.value)
        == 'Error trying to process rule "reponse_comparison":\n\nId de question inconnue: question_choix_1.'
    )


def test_function_reponse_on_question_type_choix_incorrect_choix_id():
    tree = parser.parse("reponse(question_choix_1, question_choix_1d)")
    questions = [
        Question(
            "question_choix_1",
            "choix",
            ["question_choix_1a", "question_choix_1b"],
        )
    ]
    with pytest.raises(lark.exceptions.VisitError) as error:
        FormuleChecker(questions).transform(tree)

    assert (
        str(error.value)
        == 'Error trying to process rule "reponse_comparison":\n\nL\'id de choix question_choix_1d est inconnu pour la question question_choix_1. Choix possibles : question_choix_1a, question_choix_1b'
    )


def test_function_reponse_on_question_type_choix_incorrect_type():
    tree = parser.parse("reponse(question_choix_1, question_choix_1d)")
    questions = [
        Question(
            "question_choix_1",
            "proportion",
        )
    ]
    with pytest.raises(lark.exceptions.VisitError) as error:
        FormuleChecker(questions).transform(tree)

    assert (
        str(error.value)
        == "Error trying to process rule \"reponse_comparison\":\n\nLa question d'id question_choix_1 est de type proportion, donc la fonction réponse n'attend qu'un argument."
    )


def test_function_reponse_on_correct_question_type_proportion():
    tree = parser.parse("reponse(question_proportion_1)")

    questions = [
        Question(
            "question_proportion_1",
            "proportion",
        )
    ]
    assert FormuleChecker(questions).transform(tree) == (float, "reponse")


def test_function_reponse_on_correct_question_type_binaire():
    tree = parser.parse("reponse(question_binaire_1, OUI)")

    questions = [
        Question(
            "question_binaire_1",
            "binaire",
        )
    ]
    assert FormuleChecker(questions).transform(tree) == (bool, "reponse")


def test_function_reponse_on_incorrect_question_type_binaire():
    tree = parser.parse("reponse(question_binaire_1, Ni_Oui_Ni_Non)")

    questions = [
        Question(
            "question_binaire_1",
            "binaire",
        )
    ]
    with pytest.raises(lark.exceptions.VisitError) as error:
        FormuleChecker(questions).transform(tree)

    assert (
        str(error.value)
        == 'Error trying to process rule "reponse_comparison":\n\nL\'id de choix Ni_Oui_Ni_Non est inconnu pour la question question_binaire_1. Choix possibles : OUI, NON'
    )
