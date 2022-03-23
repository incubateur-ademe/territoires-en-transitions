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


def test_math_operation_on_proportion():
    tree = parser.parse("reponse(question_proportion) - 0.2")
    assert (
            FormuleInterpreter(reponses=[Reponse("question_proportion", 1.0)]).visit(tree)
            == 0.8
    )


def test_regle_cae_1_2_3():
    """
    Pour une collectivité ne possédant que **partiellement**
    les compétences collecte, traitement des déchets et plan de prévention des déchets,
    le score de la 1.2.3 est réduit de 25 %.

    Pour une collectivité n'ayant **aucune**
    les compétences collecte, traitement des déchets et plan de prévention des déchets,
    le score de la 1.2.3 est réduit à 2 points.
    """
    formule = "si reponse(dechets_1, OUI) et reponse(dechets_2, OUI) et reponse(dechets_3, OUI) alors 1.0 " \
              "sinon si reponse(dechets_1, NON) et reponse(dechets_2, NON) et reponse(dechets_3, NON) alors 2/12 " \
              "sinon 0.75"
    tree = parser.parse(formule)

    # 1 Toutes les compétences
    cas1 = [Reponse("dechets_1", "OUI"), Reponse("dechets_2", "OUI"), Reponse("dechets_3", "OUI")]

    # 2 Une des compétences
    cas2a = [Reponse("dechets_1", "OUI"), Reponse("dechets_2", "NON"), Reponse("dechets_3", "NON")]
    cas2b = [Reponse("dechets_1", "NON"), Reponse("dechets_2", "OUI"), Reponse("dechets_3", "NON")]
    cas2c = [Reponse("dechets_1", "NON"), Reponse("dechets_2", "NON"), Reponse("dechets_3", "OUI")]

    # 3 Aucune des compétences
    cas3 = [Reponse("dechets_1", "NON"), Reponse("dechets_2", "NON"), Reponse("dechets_3", "NON")]

    assert (FormuleInterpreter(cas1).visit(tree) == 1.0)

    for cas in [cas2a, cas2b, cas2c]:
        assert (FormuleInterpreter(cas).visit(tree) == 0.75)

    assert (FormuleInterpreter(cas3).visit(tree) == 2 / 12)


def test_regle_cae_3_1_1():
    """"
    Pour une collectivité non autorité organisatrice de la distribution d'électricité,
    le score de la 3.1.1 est réduit de 30 %.
    Pour une collectivité non autorité organisatrice de la distribution de gaz,
    le score de la 3.1.1 est réduit de 30 %.
    Pour une collectivité non autorité organisatrice de la distribution de chaleur,
    le score de la 3.1.1 est réduit de 40 %.
    Ces réductions sont cumulables dans la limite de 2 points restants
    pour prendre en compte la part d’influence dans les instances compétentes et les actions partenariales.
    """
    # todo clarifier la règle.
    formule = "si reponse(AOD_elec, OUI) et reponse(AOD_gaz, OUI) et reponse(AOD_chaleur, OUI) alors 1.0 " \
              "sinon si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 2/10" \
              "sinon si reponse(AOD_elec, NON) ou reponse(AOD_gaz, NON) alors 7/10 " \
              "sinon si reponse(AOD_chaleur, NON) alors 6/10 " \
              "sinon si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) alors 4/10 " \
              "sinon si reponse(AOD_elec, NON) et reponse(AOD_chaleur, NON) alors 3/10 " \
              "sinon si reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 3/10 " \

    tree = parser.parse(formule)

    # 1 Toutes les compétences
    cas1 = [Reponse("AOD_elec", "OUI"), Reponse("AOD_gaz", "OUI"), Reponse("AOD_chaleur", "OUI")]

    # 2 Aucune compétence
    cas2 = [Reponse("AOD_elec", "NON"), Reponse("AOD_gaz", "NON"), Reponse("AOD_chaleur", "NON")]

    assert (FormuleInterpreter(cas1).visit(tree) == 1.0)
    assert (FormuleInterpreter(cas2).visit(tree) == 2/10)
