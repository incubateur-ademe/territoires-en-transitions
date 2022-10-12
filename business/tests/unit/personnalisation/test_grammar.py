from business.evaluation.personnalisation.parser import parser
from business.evaluation.personnalisation.math import MathTransformer


def test_a_parser_should_be_built_from_grammar():
    assert parser is not None


def test_multiplication():
    tree = parser.parse("2 * 5")
    result = MathTransformer().transform(tree)
    assert result == 10


def test_math_operator_precedence():
    tree = parser.parse("3 + 4 * 5 / 2")
    result = MathTransformer().transform(tree)
    assert result == 13
