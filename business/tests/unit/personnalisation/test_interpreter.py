import pytest

from business.personnalisation.engine.formule import (
    ReponseMissing,
)
from business.personnalisation.engine.formule_interpreter import FormuleInterpreter
from business.personnalisation.engine.models import Reponse
from business.personnalisation.engine.parser import parser


def test_function_reponse_on_question_type_choix():
    tree = parser.parse("reponse(question_choix_1, question_choix_1a)")
    assert (
        FormuleInterpreter([Reponse("question_choix_1", "question_choix_1a")]).visit(
            tree
        )
        is True
    )
    assert (
        FormuleInterpreter([Reponse("question_choix_1", "question_choix_1b")]).visit(
            tree
        )
        is False
    )


def test_function_reponse_on_question_typebinaire():
    tree = parser.parse("reponse(question_binaire_1, OUI)")
    assert (
        FormuleInterpreter([Reponse("question_binaire_1", "OUI")]).visit(tree) is True
    )
    assert (
        FormuleInterpreter([Reponse("question_binaire_1", "NON")]).visit(tree) is False
    )


def test_function_reponse_on_question_type_proportion():
    tree = parser.parse("reponse(question_proportion)")
    assert (
        FormuleInterpreter(reponses=[Reponse("question_proportion", 0.7)]).visit(tree)
        is 0.7
    )


def test_function_reponse_value_raises_if_no_reponse():
    tree = parser.parse("reponse(question_X)")
    with pytest.raises(ReponseMissing):
        FormuleInterpreter([]).visit(tree)


def test_function_reponse_comparison_raises_if_no_reponse():
    tree = parser.parse("reponse(question_X, choix_A)")
    with pytest.raises(ReponseMissing):
        FormuleInterpreter([]).visit(tree)


def test_statement_if_then():
    interpreter = FormuleInterpreter([])

    tree = parser.parse("si VRAI alors 2")
    assert interpreter.visit(tree) == 2.0

    tree = parser.parse("si FAUX alors 2")
    assert interpreter.visit(tree) is None


def test_statement_if_then_else():
    interpreter = FormuleInterpreter([])

    tree = parser.parse("si vrai alors 2 sinon si faux alors 4 sinon 8")
    assert interpreter.visit(tree) == 2

    tree = parser.parse("si faux alors 2 sinon si vrai alors 4 sinon 8")
    assert interpreter.visit(tree) == 4

    tree = parser.parse("si faux alors 2 sinon si faux alors 4 sinon 8")
    assert interpreter.visit(tree) == 8


def test_logical_or():
    interpreter = FormuleInterpreter([])

    assert interpreter.visit(parser.parse("vrai ou faux")) == (True or False)
    assert interpreter.visit(parser.parse("faux ou vrai")) == (False or True)
    assert interpreter.visit(parser.parse("vrai ou vrai")) == (True or True)
    assert interpreter.visit(parser.parse("faux ou faux")) == (False or False)


def test_logical_and():
    interpreter = FormuleInterpreter([])

    assert interpreter.visit(parser.parse("vrai et faux")) == (True and False)
    assert interpreter.visit(parser.parse("faux et vrai")) == (False and True)
    assert interpreter.visit(parser.parse("vrai et vrai")) == (True and True)
    assert interpreter.visit(parser.parse("faux et faux")) == (False and False)


def test_function_max():
    interpreter = FormuleInterpreter([])

    assert interpreter.visit(parser.parse("max(2, 3)")) == max(2, 3)
    assert interpreter.visit(parser.parse("max(3, 2)")) == max(3, 2)


def test_function_min():
    interpreter = FormuleInterpreter([])

    assert interpreter.visit(parser.parse("min(2, 3)")) == min(2, 3)
    assert interpreter.visit(parser.parse("min(3, 2)")) == min(3, 2)


def test_operator_add():
    interpreter = FormuleInterpreter([])

    assert interpreter.visit(parser.parse("2 + 3")) == 2 + 3
    assert interpreter.visit(parser.parse("3 + 2")) == 3 + 2


def test_operator_sub():
    interpreter = FormuleInterpreter([])

    assert interpreter.visit(parser.parse("2 - 3")) == 2 - 3
    assert interpreter.visit(parser.parse("3 - 2")) == 3 - 2


def test_operator_mul():
    interpreter = FormuleInterpreter([])

    assert interpreter.visit(parser.parse("2 * 3")) == 2 * 3
    assert interpreter.visit(parser.parse("3 * 2")) == 3 * 2


def test_operator_div():
    interpreter = FormuleInterpreter([])

    assert interpreter.visit(parser.parse("2 / 3")) == 2 / 3
    assert interpreter.visit(parser.parse("3 / 2")) == 3 / 2


def test_operator_precedence():
    interpreter = FormuleInterpreter([])

    assert interpreter.visit(parser.parse("1 + 2 * 3 - 4")) == 1 + 2 * 3 - 4
