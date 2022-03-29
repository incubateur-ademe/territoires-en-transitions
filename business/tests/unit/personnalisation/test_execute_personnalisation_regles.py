from typing import List
import pytest
from business.personnalisation.models import Reponse
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

personnalisation_regles: List[ActionPersonnalisationRegles] = [
    ActionPersonnalisationRegles(
        ActionId("eci_1"),
        [
            Regle("reponse(mobilite_1, VRAI)", "desactivation"),
            Regle("reponse(mobilite_2)", "reduction"),
        ],
    ),
]


@pytest.fixture
def regles_parser() -> ReglesParser:
    return ReglesParser(personnalisation_regles)


def test_execute_personnalisation_regles_when_all_reponses_are_given(regles_parser):
    reponses = [Reponse("mobilite_1", True), Reponse("mobilite_2", 0.6)]
    assert execute_personnalisation_regles(regles_parser, reponses) == {
        ActionId("eci_1"): ActionPersonnalisationConsequence(
            desactive=True, potentiel_perso=0.6
        )
    }


def test_execute_personnalisation_regles_when_some_reponses_are_not_given(
    regles_parser,
):
    reponses = [Reponse("mobilite_2", 0.2)]
    assert execute_personnalisation_regles(regles_parser, reponses) == {
        ActionId("eci_1"): ActionPersonnalisationConsequence(
            desactive=None, potentiel_perso=0.2
        )
    }
