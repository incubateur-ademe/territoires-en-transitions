import lark
import pytest

from business.personnalisation.engine.formule import (
    FormuleInterpreter,
    Reponse,
)
from business.personnalisation.engine.parser import parser


def test_function_reponse_on_question_type_choix():
    tree = parser.parse("reponse(question_choix_1, question_choix_1a)")
    assert (
        FormuleInterpreter(
            [Reponse("question_choix_1", "question_choix_1a")]
        ).transform(tree)
        is True
    )
    assert (
        FormuleInterpreter(
            [Reponse("question_choix_1", "question_choix_1b")]
        ).transform(tree)
        is True
    )


def test_function_reponse_on_question_typebinaire():
    tree = parser.parse("reponse(question_binaire_1, OUI)")
    assert (
        FormuleInterpreter([Reponse("question_binaire_1", "OUI")]).transform(tree)
        is True
    )
    assert (
        FormuleInterpreter([Reponse("question_binaire_1", "NON")]).transform(tree)
        is False
    )


def test_function_reponse_on_question_type_proportion():
    tree = parser.parse("reponse(question_proportion)")
    assert (
        FormuleInterpreter(reponses=[Reponse("question_proportion", 0.7)]).transform(
            tree
        )
        is 0.7
    )


def test_function_reponse_value_raises_if_no_reponse():
    tree = parser.parse("reponse(question_X)")
    with pytest.raises(lark.exceptions.VisitError):
        FormuleInterpreter([]).transform(tree)


def test_function_reponse_comparison_raises_if_no_reponse():
    tree = parser.parse("reponse(question_X, choix_A)")
    with pytest.raises(lark.exceptions.VisitError):
        FormuleInterpreter([]).transform(tree)


# def test_function_simple_if_statement():
#     context = Context(
#         reponses=[],
#     )
#     tree = parser.parse("si true alors 0.8 sinon 0.1")
#     result = FormuleTransformer(context).transform(tree)
#     assert result == 0.8


# def test_function_multiple_if_statement():
#     context = Context(
#         reponses=[],
#         questions=[],
#     )
#     assert (
#         FormuleTransformer(context).transform(
#             parser.parse("si vrai alors 2 sinon si faux alors 4 sinon 8")
#         )
#         == 2
#     )
#     assert (
#         FormuleTransformer(context).transform(
#             parser.parse("si faux alors 2 sinon si vrai alors 4 sinon 8")
#         )
#         == 4
#     )
#     assert (
#         FormuleTransformer(context).transform(
#             parser.parse("si faux alors 2 sinon si faux alors 4 sinon 8")
#         )
#         == 8
#     )


# def test_function_or():
#     context = Context(
#         reponses=[],
#         questions=[],
#     )
#     assert FormuleTransformer(context).transform(parser.parse("true ou false")) is True
#     assert FormuleTransformer(context).transform(parser.parse("false ou true")) is False
#     assert FormuleTransformer(context).transform(parser.parse("true ou true")) is True
#     assert FormuleTransformer(context).transform(parser.parse("false ou false")) is True
