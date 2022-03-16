from lark import Lark

from business.personnalisation.engine.formule import FormuleTransformer, Context, Identite, Reponses
from business.personnalisation.engine.grammar import formule_grammar
from business.personnalisation.engine.math import MathTransformer


def test_a_parser_should_be_built_from_grammar():
    parser = Lark(formule_grammar, parser="lalr")
    assert parser is not None


def test_multiplication():
    parser = Lark(formule_grammar, parser="lalr")
    tree = parser.parse('2 * 5')
    result = MathTransformer().transform(tree)
    assert result == 10


def test_math_operator_precedence():
    parser = Lark(formule_grammar, parser="lalr")
    tree = parser.parse('3 + 4 * 5 / 2')
    result = MathTransformer().transform(tree)
    assert result == 13


def test_reponse_function():
    parser = Lark(formule_grammar, parser="lalr")

    context = Context(
        identite=Identite(
            localisation=set(),
            population={"moins_de_100000"},
            type={"commune"}
        ),
        reponses=Reponses(
            mobilite_1="OUI",
            mobilite_2="mobilite_2_b"
        )
    )

    tree = parser.parse('reponse (mobilite_2, mobilite_2_b)')
    result = FormuleTransformer(context).transform(tree)
    assert result is True
