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
from business.personnalisation.models import ActionPersonnalisationConsequence
from business.referentiel.adapters.supabase_referentiel_repo import (
    SupabaseReferentielRepository,
)
from business.personnalisation.ports.personnalisation_repo import (
    InMemoryPersonnalisationRepository,
)
from business.utils.action_id import ActionId
from business.utils.config import Config
from business.utils.domain_message_bus import InMemoryDomainMessageBus
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
