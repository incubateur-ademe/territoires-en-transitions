from typing import List
import pytest

from business.personnalisation.models import IdentiteCollectivite, Reponse
from business.personnalisation.engine.regles_parser import ReglesParser
from business.personnalisation.execute_personnalisation_regles import (
    ActionPersonnalisationConsequence,
    execute_personnalisation_regles,
)
from business.referentiel.domain.models.personnalisation import (
    ActionPersonnalisationRegles,
    Regle,
)
from business.utils.action_id import ActionId


def test_execute_personnalisation_regles_when_all_reponses_are_given():
    regles_parser = ReglesParser(
        [
            ActionPersonnalisationRegles(
                ActionId("eci_1"),
                [
                    Regle("reponse(mobilite_1, VRAI)", "desactivation"),
                    Regle("reponse(mobilite_2)", "reduction"),
                ],
            )
        ]
    )
    reponses = [Reponse("mobilite_1", True), Reponse("mobilite_2", 0.6)]
    assert execute_personnalisation_regles(
        regles_parser, reponses, IdentiteCollectivite()
    )[ActionId("eci_1")] == ActionPersonnalisationConsequence(
        desactive=True, potentiel_perso=0.6
    )


def test_execute_personnalisation_regles_when_some_reponses_are_not_given():
    regles_parser = ReglesParser(
        [
            ActionPersonnalisationRegles(
                ActionId("eci_1"),
                [
                    Regle("reponse(mobilite_1, VRAI)", "desactivation"),
                    Regle("reponse(mobilite_2)", "reduction"),
                ],
            )
        ]
    )
    reponses = [Reponse("mobilite_2", 0.2)]
    assert execute_personnalisation_regles(
        regles_parser, reponses, IdentiteCollectivite()
    )[ActionId("eci_1")] == ActionPersonnalisationConsequence(
        desactive=None, potentiel_perso=0.2
    )


def test_execute_personnalisation_regles_when_both_identite_type_and_reponse_are_needed():
    regles_parser = ReglesParser(
        [
            ActionPersonnalisationRegles(
                ActionId("eci_1"),
                [
                    Regle(
                        "identite(type, EPCI) et identite(localisation, DOM) et reponse(EP_1, EP_1_c)",
                        "desactivation",
                    ),
                ],
            )
        ]
    )
    reponses = [Reponse("EP_1", "EP_1_c")]
    identite = IdentiteCollectivite(type={"EPCI", "commune"}, localisation={"DOM"})

    assert execute_personnalisation_regles(regles_parser, reponses, identite) == {
        ActionId("eci_1"): ActionPersonnalisationConsequence(
            desactive=True, potentiel_perso=None
        )
    }


def test_execute_personnalisation_regles_with_identite_population():
    regles_parser = ReglesParser(
        [
            ActionPersonnalisationRegles(
                ActionId("eci_1"),
                [
                    Regle(
                        "si identite(population, moins_de_5000) et reponse (EP_1, EP_1_b) alors 2/12",
                        "reduction",
                    ),
                ],
            )
        ]
    )
    reponses = [Reponse("EP_1", "EP_1_b")]
    identite = IdentiteCollectivite(population={"moins_de_5000"})

    assert execute_personnalisation_regles(regles_parser, reponses, identite) == {
        ActionId("eci_1"): ActionPersonnalisationConsequence(
            desactive=None, potentiel_perso=2 / 12
        )
    }
