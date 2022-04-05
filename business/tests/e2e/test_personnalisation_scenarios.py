from typing import Dict, List
from business.evaluation.domain.models.events import ReponseUpdatedForCollectivite
from business.evaluation.domain.use_cases.compute_and_store_referentiel_personnalisations_for_collectivite import (
    ComputeAndStoreReferentielPersonnalisationsForCollectivite,
)
from business.personnalisation.adapters.supabase_personnalisation_repo import (
    SupabasePersonnalisationRepository,
)
from business.personnalisation.engine.regles_parser import ReglesParser
from business.personnalisation.models import ActionPersonnalisationConsequence, Reponse
from business.personnalisation.ports.personnalisation_repo import (
    InMemoryPersonnalisationRepository,
)
from business.utils.action_id import ActionId
from business.utils.config import Config
from business.utils.domain_message_bus import InMemoryDomainMessageBus


def prepare_use_case():
    # prepare use case
    bus = InMemoryDomainMessageBus()
    supabase_personnalisation_repo = SupabasePersonnalisationRepository(
        Config.get_supabase_client()
    )
    action_personnalisation_regles = (
        supabase_personnalisation_repo.get_personnalisation_regles()
    )
    regles_parser = ReglesParser(action_personnalisation_regles)

    in_memory_personnalisation_repo = InMemoryPersonnalisationRepository()
    use_case = ComputeAndStoreReferentielPersonnalisationsForCollectivite(
        bus, in_memory_personnalisation_repo, regles_parser
    )
    return use_case, in_memory_personnalisation_repo


def given_reponse_assert_personnalisation_consequences(
    reponses: List[Reponse],
    expected_consequences: Dict[str, ActionPersonnalisationConsequence],
):
    use_case, in_memory_personnalisation_repo = prepare_use_case()
    # set context
    in_memory_personnalisation_repo.set_reponses(reponses)
    # execute
    use_case.execute(ReponseUpdatedForCollectivite(1))

    # assert
    computed_consequences = in_memory_personnalisation_repo.get_action_personnalisation_consequences_for_collectivite(
        1
    )
    for action_id, expected_consequence in expected_consequences.items():
        assert computed_consequences[ActionId(action_id)] == expected_consequence


def test_regle_cae_311_reduite_case_1():
    given_reponse_assert_personnalisation_consequences(
        [Reponse("AOD_elec", "NON"), Reponse("AOD_gaz", "NON")],
        {
            "cae_3.1.1": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=0.7
            )
        },
    )


def test_regle_cae_311_not_reduite_case_2():
    given_reponse_assert_personnalisation_consequences(
        [
            Reponse("AOD_elec", "OUI"),
            Reponse("AOD_gaz", "OUI"),
            Reponse("AOD_chaleur", "NON"),
        ],
        {
            "cae_3.1.1": ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=0.6
            )
        },
    )


def test_regle_eci_43_desactive():
    given_reponse_assert_personnalisation_consequences(
        [Reponse("dev_eco_1", "NON"), Reponse("AOD_gaz", "NON")],
        {
            "eci_4.3": ActionPersonnalisationConsequence(
                desactive=True, potentiel_perso=None
            )
        },
    )
