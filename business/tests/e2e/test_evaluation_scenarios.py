from typing import List
from business.evaluation.adapters.replay_realtime import ReplayRealtime
from business.evaluation.domain.models import events
from business.evaluation.domain.models.action_score import ActionScore
from business.evaluation.domain.models.events import (
    ActionStatutOrConsequenceUpdatedForCollectivite,
)
from business.evaluation.domain.ports.action_status_repo import (
    InMemoryActionStatutRepository,
)
from business.evaluation.domain.use_cases.compute_referentiel_scores_for_collectivite import (
    ComputeReferentielScoresForCollectivite,
)
from business.personnalisation.models import ActionPersonnalisationConsequence, Reponse
from business.referentiel.adapters.supabase_referentiel_repo import (
    SupabaseReferentielRepository,
)
from business.personnalisation.ports.personnalisation_repo import (
    InMemoryPersonnalisationRepository,
)
from business.utils.action_id import ActionId
from business.utils.config import Config
from business.utils.domain_message_bus import InMemoryDomainMessageBus
from business.utils.environment_variables import EnvironmentVariables
from tests.e2e.prepare_evaluation import prepare_config_and_bus
from tests.utils.spy_on_event import spy_on_event


def prepare_use_case():
    bus = InMemoryDomainMessageBus()
    supabase_referentiel_repo = SupabaseReferentielRepository(
        Config.get_supabase_client()
    )
    in_memory_personnalisation_repo = InMemoryPersonnalisationRepository()
    statuses_repo = InMemoryActionStatutRepository()
    use_case = ComputeReferentielScoresForCollectivite(
        bus, supabase_referentiel_repo, in_memory_personnalisation_repo, statuses_repo
    )
    return use_case, in_memory_personnalisation_repo, statuses_repo, bus


def test_eci_desactivation_of_sous_action_242_should_redistribute_points_amongst_siblings():
    use_case, in_memory_personnalisation_repo, statuses_repo, bus = prepare_use_case()

    in_memory_personnalisation_repo.set_action_personnalisation_consequences(
        {ActionId("eci_2.4.2"): ActionPersonnalisationConsequence(desactive=True)}
    )

    scores_computed = spy_on_event(bus, events.ReferentielScoresForCollectiviteComputed)
    use_case.execute(ActionStatutOrConsequenceUpdatedForCollectivite(1, "eci"))

    scores_by_id = {score.action_id: score for score in scores_computed[0].scores}

    # Action 2.4.2 is desactie, hence not concerne and worth 0 point.
    assert scores_by_id["eci_2.4.2"] == ActionScore(
        action_id=ActionId("eci_2.4.2"),
        point_fait=0.0,
        point_programme=0.0,
        point_pas_fait=0.0,
        point_non_renseigne=0.0,
        point_potentiel=0.0,
        point_referentiel=4,
        concerne=False,
        total_taches_count=4,
        completed_taches_count=4,
        referentiel="eci",
        desactive=True,
        point_potentiel_perso=None,
    )

    # Points redistributed amongst the 4 non reglementaires siblings
    assert scores_by_id["eci_2.4.0"].point_potentiel == 0  # action réglementaire
    assert scores_by_id["eci_2.4.1"].point_potentiel == 5  # (4 + 1)
    assert scores_by_id["eci_2.4.2"].point_potentiel == 0  # desactive
    assert scores_by_id["eci_2.4.3"].point_potentiel == 3  # (2 + 1)
    assert scores_by_id["eci_2.4.4"].point_potentiel == 7  # (6 + 1)
    assert scores_by_id["eci_2.4.5"].point_potentiel == 5  # (4 + 1)

    # expect 2.4 still worth 20 points
    assert scores_by_id["eci_2.4"] == ActionScore(
        action_id=ActionId("eci_2.4"),
        point_fait=0.0,
        point_programme=0.0,
        point_pas_fait=0.0,
        point_non_renseigne=20.0,
        point_potentiel=20.0,
        point_referentiel=20,
        concerne=True,
        total_taches_count=17,
        completed_taches_count=4,
        referentiel="eci",
        desactive=False,
        point_potentiel_perso=None,
    )


def execute_scenario_collectivite_updates_reponse(
    collectivite_id: int, reponses: List[Reponse]
):
    bus = InMemoryDomainMessageBus()
    config = prepare_config_and_bus(
        bus,
        ReplayRealtime(bus, converters=[]),
        EnvironmentVariables("SUPABASE", "SUPABASE", "REPLAY"),
    )
    config.statuses_repo = InMemoryActionStatutRepository()

    config.personnalisation_repo.get_reponses_for_collectivite = (
        lambda collectivite_id: reponses
    )

    scores_computed = spy_on_event(bus, events.ReferentielScoresForCollectiviteComputed)

    bus.publish_event(events.ReponseUpdatedForCollectivite(collectivite_id))

    eci_scores_by_id = {score.action_id: score for score in scores_computed[0].scores}
    cae_scores_by_id = {score.action_id: score for score in scores_computed[1].scores}

    return eci_scores_by_id, cae_scores_by_id


def test_cae_321_when_recuperation_cogeneration_is_NON():
    """Si la récupération recuperation_cogeneration est NON, alors, cae_3.2.1.2 et cae_3.2.1.3 sont désactivées et cae_3.2.1.1 vaut 2 points"""
    _, cae_scores_by_id = execute_scenario_collectivite_updates_reponse(
        1, [Reponse(ActionId("recuperation_cogeneration"), "NON")]
    )
    assert (
        cae_scores_by_id["cae_3.2.1"].point_potentiel
        == cae_scores_by_id["cae_3.2.1"].point_potentiel_perso
        == 2.0
    )
    assert cae_scores_by_id["cae_3.2.1.1"].point_potentiel == 2.0
    assert cae_scores_by_id["cae_3.2.1.2"].point_potentiel == 0
    assert cae_scores_by_id["cae_3.2.1.3"].point_potentiel == 0

    assert cae_scores_by_id["cae_3.2.1.2"].desactive == True
    assert cae_scores_by_id["cae_3.2.1.3"].desactive == True


def test_cae_631_when_dev_eco_2_is_0():
    """La réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de développement économique, dans la limite de 2 points de potentiel restant"""
    _, cae_scores_by_id = execute_scenario_collectivite_updates_reponse(
        1, [Reponse(ActionId("dev_eco_2"), 0.0)]
    )
    assert (
        round(cae_scores_by_id["cae_6.3.1"].point_potentiel, 0)
        == cae_scores_by_id["cae_6.3.1"].point_potentiel_perso
        == 2
    )


# cae_6.3.1
# si commune et reponse(dev_eco_2, 0.1) et reponse(dev_eco_4, NON) alors reduction(cae_6.3.1, 2/8) et desactivation(cae_6.3.1.4, true)
# si desactivation(cae_6.3.1.4, true) alors ses points sont redistribués sur la cae_6.3.1.3 et la cae_6.3.1.5 uniquement, c'est à dire :
#  - 6.3.1.1 proportion 15% => 15%
#  - 6.3.1.2 proportion 20% => 20%
#  - 6.3.1.3 proportion 20% => 32.5%
#  - 6.3.1.4 proportion 25% => Désactivé, non-concerné, 0%
#  - 6.3.1.5 proportion 20% => 32.5%
