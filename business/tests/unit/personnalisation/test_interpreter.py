import pytest

from business.personnalisation.engine.formule import (
    ReponseMissing,
)
from business.personnalisation.engine.formule_interpreter import ReponsesInterpreter
from business.personnalisation.models import Reponse, IdentiteCollectivite
from business.personnalisation.engine.parser import parser


def test_function_reponse_on_question_type_choix():
    tree = parser.parse("reponse(question_choix_1, question_choix_1a)")
    assert (
        ReponsesInterpreter([Reponse("question_choix_1", "question_choix_1a")]).visit(
            tree
        )
        is True
    )
    assert (
        ReponsesInterpreter([Reponse("question_choix_1", "question_choix_1b")]).visit(
            tree
        )
        is False
    )


def test_function_reponse_on_question_typebinaire():
    tree = parser.parse("reponse(question_binaire_1, OUI)")
    assert (
        ReponsesInterpreter([Reponse("question_binaire_1", "OUI")]).visit(tree) is True
    )
    assert (
        ReponsesInterpreter([Reponse("question_binaire_1", "NON")]).visit(tree) is False
    )


def test_function_reponse_on_question_type_proportion():
    tree = parser.parse("reponse(question_proportion)")
    assert (
        ReponsesInterpreter(reponses=[Reponse("question_proportion", 0.7)]).visit(tree)
        is 0.7
    )


def test_function_reponse_value_raises_if_no_reponse():
    tree = parser.parse("reponse(question_X)")
    with pytest.raises(ReponseMissing):
        ReponsesInterpreter([]).visit(tree)


def test_function_reponse_comparison_returns_false_if_no_reponse():
    tree = parser.parse("reponse(question_X, choix_A)")
    assert ReponsesInterpreter([]).visit(tree) is False


def test_function_identite_on_type():
    commune_de_moins_de_100000_hab = IdentiteCollectivite(
        type={"commune"}, population={"moins_de_10000"}, localisation=set()
    )
    assert ReponsesInterpreter().visit(parser.parse("identite(type, commune)")) is False
    assert (
        ReponsesInterpreter(identite=commune_de_moins_de_100000_hab).visit(
            parser.parse("identite(type, commune)")
        )
        is True
    )

    assert ReponsesInterpreter().visit(parser.parse("identite(type, commune)")) is False
    assert (
        ReponsesInterpreter(identite=commune_de_moins_de_100000_hab).visit(
            parser.parse("identite(population, moins_de_10000)")
        )
        is True
    )

    assert (
        ReponsesInterpreter().visit(parser.parse("identite(localisation, DOM)"))
        is False
    )
    assert (
        ReponsesInterpreter(identite=commune_de_moins_de_100000_hab).visit(
            parser.parse("identite(localisation, DOM)")
        )
        is False
    )


def test_statement_if_then():
    interpreter = ReponsesInterpreter([])

    tree = parser.parse("si VRAI alors 2")
    assert interpreter.visit(tree) == 2.0

    tree = parser.parse("si FAUX alors 2")
    assert interpreter.visit(tree) is None


def test_statement_if_then_else():
    interpreter = ReponsesInterpreter([])

    tree = parser.parse("si vrai alors 2 sinon si faux alors 4 sinon 8")
    assert interpreter.visit(tree) == 2

    tree = parser.parse("si faux alors 2 sinon si vrai alors 4 sinon 8")
    assert interpreter.visit(tree) == 4

    tree = parser.parse("si faux alors 2 sinon si faux alors 4 sinon 8")
    assert interpreter.visit(tree) == 8


def test_logical_or():
    interpreter = ReponsesInterpreter([])

    assert interpreter.visit(parser.parse("vrai ou faux")) == (True or False)
    assert interpreter.visit(parser.parse("faux ou vrai")) == (False or True)
    assert interpreter.visit(parser.parse("vrai ou vrai")) == (True or True)
    assert interpreter.visit(parser.parse("faux ou faux")) == (False or False)


def test_logical_and():
    interpreter = ReponsesInterpreter([])

    assert interpreter.visit(parser.parse("vrai et faux")) == (True and False)
    assert interpreter.visit(parser.parse("faux et vrai")) == (False and True)
    assert interpreter.visit(parser.parse("vrai et vrai")) == (True and True)
    assert interpreter.visit(parser.parse("faux et faux")) == (False and False)


def test_function_max():
    interpreter = ReponsesInterpreter([])

    assert interpreter.visit(parser.parse("max(2, 3)")) == max(2, 3)
    assert interpreter.visit(parser.parse("max(3, 2)")) == max(3, 2)


def test_function_min():
    interpreter = ReponsesInterpreter([])

    assert interpreter.visit(parser.parse("min(2, 3)")) == min(2, 3)
    assert interpreter.visit(parser.parse("min(3, 2)")) == min(3, 2)


def test_operator_add():
    interpreter = ReponsesInterpreter([])

    assert interpreter.visit(parser.parse("2 + 3")) == 2 + 3
    assert interpreter.visit(parser.parse("3 + 2")) == 3 + 2


def test_operator_sub():
    interpreter = ReponsesInterpreter([])

    assert interpreter.visit(parser.parse("2 - 3")) == 2 - 3
    assert interpreter.visit(parser.parse("3 - 2")) == 3 - 2


def test_operator_mul():
    interpreter = ReponsesInterpreter([])

    assert interpreter.visit(parser.parse("2 * 3")) == 2 * 3
    assert interpreter.visit(parser.parse("3 * 2")) == 3 * 2


def test_operator_div():
    interpreter = ReponsesInterpreter([])

    assert interpreter.visit(parser.parse("2 / 3")) == 2 / 3
    assert interpreter.visit(parser.parse("3 / 2")) == 3 / 2


def test_operator_precedence():
    interpreter = ReponsesInterpreter([])

    assert interpreter.visit(parser.parse("1 + 2 * 3 - 4")) == 1 + 2 * 3 - 4


def test_math_operation_on_proportion():
    tree = parser.parse("reponse(question_proportion) - 0.2")
    assert (
        ReponsesInterpreter(reponses=[Reponse("question_proportion", 1.0)]).visit(tree)
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
    formule = (
        "si reponse(dechets_1, OUI) et reponse(dechets_2, OUI) et reponse(dechets_3, OUI) alors 1.0 "
        "sinon si reponse(dechets_1, NON) et reponse(dechets_2, NON) et reponse(dechets_3, NON) alors 2/12 "
        "sinon 0.75"
    )
    tree = parser.parse(formule)

    # 1 Toutes les compétences
    cas1 = [
        Reponse("dechets_1", "OUI"),
        Reponse("dechets_2", "OUI"),
        Reponse("dechets_3", "OUI"),
    ]

    # 2 Une des compétences
    cas2a = [
        Reponse("dechets_1", "OUI"),
        Reponse("dechets_2", "NON"),
        Reponse("dechets_3", "NON"),
    ]
    cas2b = [
        Reponse("dechets_1", "NON"),
        Reponse("dechets_2", "OUI"),
        Reponse("dechets_3", "NON"),
    ]
    cas2c = [
        Reponse("dechets_1", "NON"),
        Reponse("dechets_2", "NON"),
        Reponse("dechets_3", "OUI"),
    ]

    # 3 Aucune des compétences
    cas3 = [
        Reponse("dechets_1", "NON"),
        Reponse("dechets_2", "NON"),
        Reponse("dechets_3", "NON"),
    ]

    assert ReponsesInterpreter(cas1).visit(tree) == 1.0

    for cas in [cas2a, cas2b, cas2c]:
        assert ReponsesInterpreter(cas).visit(tree) == 0.75

    assert ReponsesInterpreter(cas3).visit(tree) == 2 / 12


def test_regle_cae_3_1_1():
    """ "
    Pour une collectivité non autorité organisatrice de la distribution d'électricité,
    le score de la 3.1.1 est réduit de 30 %.
    Pour une collectivité non autorité organisatrice de la distribution de gaz,
    le score de la 3.1.1 est réduit de 30 %.
    Pour une collectivité non autorité organisatrice de la distribution de chaleur,
    le score de la 3.1.1 est réduit de 40 %.
    Ces réductions sont cumulables dans la limite de 2 points restants
    pour prendre en compte la part d’influence dans les instances compétentes et les actions partenariales.
    """
    formule = (
        "si reponse(AOD_elec, OUI) et reponse(AOD_gaz, OUI) et reponse(AOD_chaleur, OUI) alors 1.0 "
        "sinon si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 2/10 "
        "sinon si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) alors 4/10 "
        "sinon si reponse(AOD_elec, NON) et reponse(AOD_chaleur, NON) alors 3/10 "
        "sinon si reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 3/10 "
        "sinon si reponse(AOD_elec, NON) ou reponse(AOD_gaz, NON) alors 7/10 "
        "sinon si reponse(AOD_chaleur, NON) alors 6/10 "
    )
    tree = parser.parse(formule)

    cas_toutes = [
        Reponse("AOD_elec", "OUI"),
        Reponse("AOD_gaz", "OUI"),
        Reponse("AOD_chaleur", "OUI"),
    ]

    cas_aucune = [
        Reponse("AOD_elec", "NON"),
        Reponse("AOD_gaz", "NON"),
        Reponse("AOD_chaleur", "NON"),
    ]

    cas_elec_only = [
        Reponse("AOD_elec", "OUI"),
        Reponse("AOD_gaz", "NON"),
        Reponse("AOD_chaleur", "NON"),
    ]

    cas_gaz_only = [
        Reponse("AOD_elec", "NON"),
        Reponse("AOD_gaz", "OUI"),
        Reponse("AOD_chaleur", "NON"),
    ]

    cas_chaleur_only = [
        Reponse("AOD_elec", "NON"),
        Reponse("AOD_gaz", "NON"),
        Reponse("AOD_chaleur", "OUI"),
    ]

    cas_chaleur_gaz = [
        Reponse("AOD_elec", "NON"),
        Reponse("AOD_gaz", "OUI"),
        Reponse("AOD_chaleur", "OUI"),
    ]

    cas_gaz_elec = [
        Reponse("AOD_elec", "OUI"),
        Reponse("AOD_gaz", "OUI"),
        Reponse("AOD_chaleur", "NON"),
    ]

    cas_chaleur_elec = [
        Reponse("AOD_elec", "OUI"),
        Reponse("AOD_gaz", "NON"),
        Reponse("AOD_chaleur", "OUI"),
    ]

    assert ReponsesInterpreter(cas_toutes).visit(tree) == 1.0
    assert ReponsesInterpreter(cas_aucune).visit(tree) == 2 / 10
    assert ReponsesInterpreter(cas_elec_only).visit(tree) == 3 / 10
    assert ReponsesInterpreter(cas_gaz_only).visit(tree) == 3 / 10
    assert ReponsesInterpreter(cas_chaleur_only).visit(tree) == 4 / 10
    assert ReponsesInterpreter(cas_chaleur_gaz).visit(tree) == 7 / 10
    assert ReponsesInterpreter(cas_gaz_elec).visit(tree) == 6 / 10
    assert ReponsesInterpreter(cas_chaleur_elec).visit(tree) == 7 / 10


def test_regle_cae_3_3_3():
    """
    Pour un EPCI, en cas de compétence "assainissement" partagée ou variable sur le territoire,
    la réduction de potentielle est proportionnelle à la part des communes ayant délégué leur compétence assainissement,
    dans la limite de moins 50%.

    Pour les communes sans compétence assainissement,
    le score de la 3.3.3 est réduit de 50 %.
    """
    formule = (
        "si identite(type, EPCI) alors max(reponse(assainissement_3), 0.5)"
        "sinon si identite(type, commune) et reponse(assainissement_1, NON) et reponse(assainissement_2, NON) alors 0.5"
    )
    tree = parser.parse(formule)

    commune = IdentiteCollectivite(type={"commune"})
    epci = IdentiteCollectivite(type={"EPCI"})

    # 1, une commune avec toutes les compétences.
    assert (
        ReponsesInterpreter(
            reponses=[
                Reponse("assainissement_1", "OUI"),
                Reponse("assainissement_2", "OUI"),
                Reponse("assainissement_3", 0.7),
            ],
            identite=commune,
        ).visit(tree)
        is None
    )

    # 2, une commune sans aucune compétence.
    assert (
        ReponsesInterpreter(
            reponses=[
                Reponse("assainissement_1", "NON"),
                Reponse("assainissement_2", "NON"),
                Reponse("assainissement_3", 0.7),
            ],
            identite=commune,
        ).visit(tree)
        == 0.5
    )

    # 3, un EPCI avec une part déléguée à 70 %
    assert (
        ReponsesInterpreter(
            reponses=[
                Reponse("assainissement_1", "NON"),
                Reponse("assainissement_2", "NON"),
                Reponse("assainissement_3", 0.7),
            ],
            identite=epci,
        ).visit(tree)
        == 0.7
    )

    # 4, un EPCI avec une part déléguée à 30 %
    assert (
        ReponsesInterpreter(
            reponses=[
                Reponse("assainissement_1", "NON"),
                Reponse("assainissement_2", "NON"),
                Reponse("assainissement_3", 0.3),
            ],
            identite=epci,
        ).visit(tree)
        == 0.5
    )


def test_regle_cae_3_3_5():
    """
    Pour une commune, la note est réduite à 2 points.
    Pour un EPCI ayant transféré la compétence traitement des déchets à un syndicat compétent en la matière, la note est réduite proportionnelle à sa participation dans cet syndicat, dans la limite de 2 points restants.
    Pour favoriser la prévention des déchets, la note attribuée à cette action ne peut dépasser celle obtenue dans l'action 1.2.3.
    """
    formule = (
        "si identite(type, commune) et reponse(dechets_2, NON) alors min(score(cae_1.2.3), 2/12)"
        "sinon si identite (type,EPCI) et reponse(dechets_2, OUI) alors min(score(cae_1.2.3), 1.0)"
        "sinon si identite(type, EPCI) et reponse(dechets_2, NON) alors min(score(cae_1.2.3), max(reponse(dechets_4), 2/12))"
    )
    tree = parser.parse(formule)

    commune = IdentiteCollectivite(type={"commune"})
    epci = IdentiteCollectivite(type={"EPCI"})

    # 1, une commune sans la compétence déchets
    assert (
        ReponsesInterpreter(
            reponses=[
                Reponse("dechets_2", "NON"),
            ],
            identite=commune,
        ).visit(tree)
        == "min(score(cae_1.2.3), 0.16666666666666666)"
    )

    # 2, une epci avec la compétence déchets
    assert (
        ReponsesInterpreter(
            reponses=[
                Reponse("dechets_2", "OUI"),
            ],
            identite=epci,
        ).visit(tree)
        == "min(score(cae_1.2.3), 1.0)"
    )

    # 3, une epci sans la compétence déchets, si réponse à dechets_4
    assert (
        ReponsesInterpreter(
            reponses=[
                Reponse("dechets_2", "NON"),
                Reponse("dechets_4", 1 / 12),
            ],
            identite=epci,
        ).visit(tree)
        == "min(score(cae_1.2.3), 0.16666666666666666)"
    )
