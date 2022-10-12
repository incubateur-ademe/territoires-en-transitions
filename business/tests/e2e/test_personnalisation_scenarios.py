from typing import Dict, List

from business.utils.models.actions import ActionId
from business.evaluation.personnalisation.regles_parser import ReglesParser
from business.evaluation.personnalisation.execute_personnalisation_regles import (
    execute_personnalisation_regles,
)
from business.utils.models.identite import IdentiteCollectivite
from business.utils.models.personnalisation import (
    ActionPersonnalisationConsequence,
)
from business.utils.models.reponse import Reponse
from .fixtures import *


def given_reponses_and_identite_assert_personnalisation_consequences(
    regles_parser: ReglesParser,
    reponses: List[Reponse],
    identite: IdentiteCollectivite,
    expected_consequences: Dict[str, ActionPersonnalisationConsequence],
):

    computed_consequences = execute_personnalisation_regles(
        regles_parser, reponses, identite
    )

    # assert
    for action_id, expected_consequence in expected_consequences.items():
        assert computed_consequences[ActionId(action_id)] == expected_consequence


def test_regle_cae_311_reduite_case_1(regles_parser):
    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [
            Reponse("AOD_elec", "OUI"),
            Reponse("AOD_gaz", "NON"),
            Reponse("AOD_chaleur", "NON"),
        ],
        IdentiteCollectivite(),
        {
            "cae_3.1.1": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=3 / 10
            )
        },
    )


def test_regle_cae_311_not_reduite_case_2(regles_parser):
    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [
            Reponse("AOD_elec", "OUI"),
            Reponse("AOD_gaz", "OUI"),
            Reponse("AOD_chaleur", "NON"),
        ],
        IdentiteCollectivite(),
        {
            "cae_3.1.1": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=0.6
            )
        },
    )


def test_regle_eci_43_desactive(regles_parser):
    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [Reponse("dev_eco_1", "NON"), Reponse("AOD_gaz", "NON")],
        IdentiteCollectivite(),
        {
            "eci_4.3": ActionPersonnalisationConsequence(
                desactive=True, potentiel_perso=None
            )
        },
    )


def test_regle_cae_4_1_2(regles_parser):
    """Pour une collectivité dont la desserte des locaux par les transports publics est inenvisageable,
    le score est diminué de 20 %.
    Pour une collectivité ne disposant pas de véhicules,
    le score est diminué de 30 % et les statuts des sous-actions 4.1.2.1, 4.1.2.3 et 4.1.2.4 sont "non concerné".
    Ces 2 réductions sont cumulables."""

    # Pas de réduction de potentiel.
    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [
            Reponse("TC_1", "OUI"),
            Reponse("vehiculeCT_1", "OUI"),
        ],
        IdentiteCollectivite(),
        {
            "cae_4.1.2": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=None
            )
        },
    )

    # Diminution de 20%.
    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [
            Reponse("TC_1", "NON"),
            Reponse("vehiculeCT_1", "OUI"),
        ],
        IdentiteCollectivite(),
        {
            "cae_4.1.2": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=0.8
            )
        },
    )

    # Diminution de 30%.
    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [
            Reponse("TC_1", "OUI"),
            Reponse("vehiculeCT_1", "NON"),
        ],
        IdentiteCollectivite(),
        {
            "cae_4.1.2": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=0.7
            )
        },
    )

    # Diminution de 50%.
    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [
            Reponse("TC_1", "NON"),
            Reponse("vehiculeCT_1", "NON"),
        ],
        IdentiteCollectivite(),
        {
            "cae_4.1.2": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=0.5
            )
        },
    )


def test_regle_cae_3_1_2_2(regles_parser):
    """Si le parent est réduit de 50%
    alors la réduction de 20% ne s'applique pas
    même si il y a des fournisseurs d'energie maîtrisés par la collectivité."""

    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [
            Reponse("AOD_elec", "NON"),
            Reponse("AOD_gaz", "NON"),
            Reponse("AOD_chaleur", "NON"),
            Reponse("fournisseur_energie", "NON"),
        ],
        IdentiteCollectivite(),
        {
            "cae_3.1.2": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=0.5
            ),
            "cae_3.1.2.2": ActionPersonnalisationConsequence(
                desactive=True, potentiel_perso=None
            ),
        },
    )

    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [
            Reponse("fournisseur_energie", "NON"),
        ],
        IdentiteCollectivite(),
        {
            "cae_3.1.2": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=0.8
            ),
            "cae_3.1.2.2": ActionPersonnalisationConsequence(
                desactive=True, potentiel_perso=None
            ),
        },
    )


def test_regle_eci_124_desactive_for_collectivite_that_arent_syndicat(regles_parser):
    # Active for a syndicat
    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [],
        IdentiteCollectivite(type={"syndicat"}),
        {
            "eci_1.2.4": ActionPersonnalisationConsequence(
                desactive=False, potentiel_perso=None
            )
        },
    )

    # Desactive for a collectivite that aren't syndicat
    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [],
        IdentiteCollectivite(type={"commune"}),
        {
            "eci_1.2.4": ActionPersonnalisationConsequence(
                desactive=True, potentiel_perso=None
            )
        },
    )


def test_regle_cae_124_desactive_for_collectivite_that_arent_syndicat(regles_parser):
    # EPCI with no habitat competence
    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [Reponse("habitat_1", "NON")],
        IdentiteCollectivite(type={"EPCI"}),
        {
            "cae_1.2.4": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=8 / 12
            )
        },
    )
    # Commune with a part of 0.3
    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [Reponse("habitat_1", "OUI"), Reponse("habitat_2", 0.3)],
        IdentiteCollectivite(type={"commune"}),
        {
            "cae_1.2.4": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=0.5
            )
        },
    )

    # Commune with a part of 0.8
    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [Reponse("habitat_1", "OUI"), Reponse("habitat_2", 0.8)],
        IdentiteCollectivite(type={"commune"}),
        {
            "cae_1.2.4": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=0.8
            )
        },
    )

    # Either commune nore EPCI
    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [],
        IdentiteCollectivite(type={"syndicat"}),
        {
            "cae_1.2.4": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=None
            )
        },
    )


def test_regle_cae_422_when_pouvoir_police_NON(
    regles_parser,
):
    # si (...)
    # sinon si reponse(pouvoir_police, NON) ou (...) alors 0.5
    given_reponses_and_identite_assert_personnalisation_consequences(
        regles_parser,
        [Reponse("pouvoir_police", "NON")],
        IdentiteCollectivite(),
        {
            "cae_4.2.2": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=0.5
            )
        },
    )
