import math
from typing import List
from business.evaluation.adapters.replay_realtime import ReplayRealtime
from business.evaluation.domain.models import events
from business.evaluation.domain.models.action_score import ActionScore
from business.evaluation.domain.models.action_statut import (
    ActionStatut,
    DetailedAvancement,
)
from business.evaluation.domain.models.events import (
    TriggerNotationForCollectiviteForReferentiel,
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


commune_id = 1
epci_id = 3810
dom_id = 5411  # Guadeloupe


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
    use_case.execute(TriggerNotationForCollectiviteForReferentiel(1, "eci"))

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
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=4,
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
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=4,
        referentiel="eci",
        desactive=False,
        point_potentiel_perso=None,
    )


def execute_scenario_collectivite_updates_reponse(
    collectivite_id: int = 1,
    reponses: List[Reponse] = [],
    statuses: List[ActionStatut] = [],
):
    bus = InMemoryDomainMessageBus()
    config = prepare_config_and_bus(
        bus,
        ReplayRealtime(bus, converters=[]),
        EnvironmentVariables("SUPABASE", "SUPABASE", "REPLAY"),
    )
    config.statuses_repo.get_all_for_collectivite = (
        lambda collectivite_id, referentiel: statuses
    )

    config.personnalisation_repo.get_reponses_for_collectivite = (
        lambda collectivite_id: reponses
    )

    scores_computed = spy_on_event(bus, events.ReferentielScoresForCollectiviteComputed)

    bus.publish_event(events.TriggerPersonnalisationForCollectivite(collectivite_id))

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


def test_cae_631_when_cae_6314_if_dev_eco_4_is_NON():
    """En l’absence de tissu économique propice à l’émergence de projets d’écologie industrielle, le score de la 6.3.1.4
    est réduit à 0 et son statut est "non concerné" : les 2 points liés sont affectés à la 6.3.1.3 et la 6.3.1.5

    Scénario testé:
    ---------------
    si reponse(dev_eco_4, NON) alors
      - 6.3.1.1 proportion 15% => 15%
      - 6.3.1.2 proportion 20% => 20%
      - 6.3.1.3 proportion 20% => 32.5%
      - 6.3.1.4 proportion 25% => Désactivé, non-concerné, 0%
      - 6.3.1.5 proportion 20% => 32.5%
    """

    _, cae_scores_by_id = execute_scenario_collectivite_updates_reponse(
        1, [Reponse(ActionId("dev_eco_4"), "NON")]
    )

    assert (
        cae_scores_by_id["cae_6.3.1.4"].desactive
        and cae_scores_by_id["cae_6.3.1.4"].point_potentiel == 0.0
    )

    # cae_6.3.1.1 and cae_6.3.1.2 are not affected
    assert math.isclose(
        cae_scores_by_id["cae_6.3.1.1"].point_potentiel,
        cae_scores_by_id["cae_6.3.1.1"].point_referentiel,
    )

    assert math.isclose(
        cae_scores_by_id["cae_6.3.1.2"].point_potentiel,
        cae_scores_by_id["cae_6.3.1.2"].point_referentiel,
    )

    # cae_6.3.1.3 and cae_6.3.1.5 have been augmented of 1 point each
    assert math.isclose(
        cae_scores_by_id["cae_6.3.1.3"].point_potentiel,
        cae_scores_by_id["cae_6.3.1.3"].point_referentiel + 1,
    )
    assert math.isclose(
        cae_scores_by_id["cae_6.3.1.5"].point_potentiel,
        cae_scores_by_id["cae_6.3.1.5"].point_referentiel + 1,
    )

    # cae_6.3.1 remains unchanged
    assert math.isclose(
        cae_scores_by_id["cae_6.3.1"].point_potentiel,
        cae_scores_by_id["cae_6.3.1"].point_referentiel,
    )


def test_cae_641_when_localosation_dom_and_SAU_OUI():
    """Reduction de 50% de la 6.4.1 & transfert de qqes points de la 6.4.1.6 à la 6.4.1.8.
    La note du référentiel actuel est à 15 %. Pour les collectivités DOM, la note de la sous-action passe à 20 % de 6 points (12 * 0.5).
    La note du référentiel actuel est à 15 %. Pour les collectivités DOM, la note de la sous-action passe à 10 % de 6 points (12 * 0.5).

    Scénario testé:
    ---------------
    si identite(localisation, DOM) alors
        - 6.4.1.1, 6.4.1.2, 6.4.1.3, 6.4.1.4, 6.4.1.5 et 6.4.1.7 inchangées
        - 6.4.1.6 passe de 15% à 20%
        - 6.4.1.8 passe de 15% à 10%
    """

    _, cae_scores_by_id = execute_scenario_collectivite_updates_reponse(
        dom_id, [Reponse("SAU", "OUI")]
    )

    # cae_6.4.1 reduite de 50%
    assert (
        cae_scores_by_id["cae_6.4.1"].point_potentiel_perso
        == cae_scores_by_id["cae_6.4.1"].point_potentiel
        == cae_scores_by_id["cae_6.4.1"].point_referentiel * 0.5
    )

    # 6.4.1.1, 6.4.1.2, 6.4.1.3, 6.4.1.4, 6.4.1.5 et 6.4.1.7 inchangées
    for action_id_unchanged in [
        "cae_6.4.1.1",
        "cae_6.4.1.2",
        "cae_6.4.1.3",
        "cae_6.4.1.4",
        "cae_6.4.1.5",
        "cae_6.4.1.7",
    ]:
        assert math.isclose(
            cae_scores_by_id[action_id_unchanged].point_potentiel,
            cae_scores_by_id[action_id_unchanged].point_referentiel * 0.5,
        )

    # 6.4.1.6 passe de 15% à 20%
    assert (
        cae_scores_by_id["cae_6.4.1.6"].point_potentiel
        == cae_scores_by_id["cae_6.4.1"].point_potentiel * 20 / 100
    )

    # 6.4.1.8 passe de 15% à 10%
    assert (
        cae_scores_by_id["cae_6.4.1.8"].point_potentiel
        == cae_scores_by_id["cae_6.4.1"].point_potentiel * 10 / 100
    )


def test_cae_621_when_type_commune():
    """Reduction potentiel cae 6.2.1 liee logement-habitat

    Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de politique du logement et du cadre de vie, dans la limite de 2 points restant minimum.
    Si la commune participe au conseil d’administration d'un bailleur social, le potentiel, possiblement réduit est
    augmenté d'un point sur la 6.2.1
    """

    # Cas 1 :  Si une commune est à 10 % de l'EPCI et qu'elle participe au conseil d'administration d'un bailleur social, elle est notée sur 3 points
    # ------
    # si identite(type, commune) et reponse(habitat_3, OUI) et reponse(habitat_2, 10%)
    #    - cae 6.2.1 est réduite à 2 points et on lui ajoute 1 point, donc a un potentiel de 3 points

    _, cae_scores_by_id = execute_scenario_collectivite_updates_reponse(
        1, [Reponse("habitat_3", "OUI"), Reponse("habitat_2", 0.1)]
    )
    assert math.isclose(cae_scores_by_id["cae_6.2.1"].point_potentiel, 3)

    # Cas 2 :  Si une commune est à 50 % de l'EPCI et qu'elle participe au conseil d'administration d'un bailleur social, elle est notée sur 6 points
    # -------
    # si identite(type, commune) et reponse(habitat_3, OUI) et reponse(habitat_2, 50%)
    #    - cae 6.2.1 est réduite de 50% et on lui ajoute 1 point, donc a un potentiel de 6 points

    _, cae_scores_by_id = execute_scenario_collectivite_updates_reponse(
        1, [Reponse("habitat_3", "OUI"), Reponse("habitat_2", 0.5)]
    )
    assert math.isclose(cae_scores_by_id["cae_6.2.1"].point_potentiel, 6)

    # Cas 3 :  Si une commune est à 10 % de l'EPCI et qu'elle ne participe pas au conseil d'administration d'un bailleur social, elle est notée sur 2 points
    # ------
    # si identite(type, commune) et reponse(habitat_3, OUI) et reponse(habitat_2, 10%)
    #    - cae 6.2.1 est réduite à 2 points et on lui ajoute 1 point, donc a un potentiel de 3 points
    _, cae_scores_by_id = execute_scenario_collectivite_updates_reponse(
        1, [Reponse("habitat_3", "NON"), Reponse("habitat_2", 0.1)]
    )
    assert math.isclose(cae_scores_by_id["cae_6.2.1"].point_potentiel, 2)


def test_cae_335_with_score_taken_into_account():
    """Overide du score de cae_3.3.5 liée au score obtenue à l'action cae_1.2.3

    Pour une commune, la note est réduite à 2 points en l'absence de la compétence traitement des déchets.
    Pour un EPCI ayant transféré la compétence traitement des déchets à un syndicat compétent en la matière, la note est réduite proportionnelle à sa participation dans ce syndicat, dans la limite de 2 points restants.
    Pour favoriser la prévention des déchets, la note attribuée à cette action ne peut dépasser celle obtenue dans l'action 1.2.3.
    """
    # Cas 1 :  Si commune avec compétence déchets, il n'y a pas de réduction de potentiel.
    # ------
    _, cae_scores_by_id = execute_scenario_collectivite_updates_reponse(
        commune_id,
        [Reponse("dechets_2", "OUI")],
        [  # Quand reponse(dechets_2, OUI), cae_1.2.3 est réduit de 0.75, et est donc notée sur 7.5 points au lieu de 10 points.
            # La sous-action cae_1.2.3.3 représente 30% de l'action donc est noté sur 30% de 7.5 points, ce qui fait 2.25 points.
            ActionStatut(ActionId("cae_1.2.3.3.1"), DetailedAvancement(1, 0, 0), True),
            ActionStatut(ActionId("cae_1.2.3.3.2"), DetailedAvancement(1, 0, 0), True),
            ActionStatut(ActionId("cae_1.2.3.3.3"), DetailedAvancement(1, 0, 0), True),
            ActionStatut(ActionId("cae_1.2.3.3.4"), DetailedAvancement(1, 0, 0), True),
            ActionStatut(ActionId("cae_1.2.3.3.5"), DetailedAvancement(1, 0, 0), True),
            # La sous-action cae_3.3.5.3 vaut initiallement 4.8 points
            # Chaque tâche de cette sous-saction vaut 1.2 points, donc si une tâche est faite, score_realise(cae_3.3.5) = 1.2
            ActionStatut(ActionId("cae_3.3.5.3.1"), DetailedAvancement(1, 0, 0), True),
        ],
    )
    assert math.isclose(cae_scores_by_id["cae_1.2.3"].point_fait, 2.25)
    assert math.isclose(cae_scores_by_id["cae_3.3.5"].point_fait, 1.2)

    # Cas 2 :  Si commune avec compétence déchets, il n'y a pas de réduction de potentiel mais le score de la 3.3.5 est majoré par celui de la 1.2.3
    # ------
    _, cae_scores_by_id = execute_scenario_collectivite_updates_reponse(
        commune_id,
        [Reponse("dechets_2", "OUI")],
        [
            # La sous-action cae_3.3.5.3 vaut initialement 4.8 points
            # Chaque tâche de cette sous-saction vaut 1.2 points, donc si une tâche est faite, score_realise(cae_3.3.5) = 1.2
            # Aucune réponse pour cae_1.2.3 => score_realise(cae_1.2.3) = 0
            # La majoration du score de la 3.3.5 par la 1.2.3 entraîne donc que la 3.3.5 vaut a un score réalisé de 0 point.
            ActionStatut(ActionId("cae_3.3.5.3.1"), DetailedAvancement(1, 0, 0), True),
        ],
    )
    assert math.isclose(cae_scores_by_id["cae_1.2.3"].point_fait, 0)
    assert math.isclose(cae_scores_by_id["cae_3.3.5"].point_fait, 0)  # Au lieu de 1.2 !

    # Cas 3 :  Si EPCI sans compétence déchets et participation dans syndicat compétent de 10% et points_fait(cae_1.2.3, 2.25) alors potentiel(cae_3.3.5) = 2
    # ------
    _, cae_scores_by_id = execute_scenario_collectivite_updates_reponse(
        epci_id,
        [Reponse("dechets_2", "NON"), Reponse("dechets_4", 0.1)],
        [  # Quand reponse(dechets_2, NON), cae_1.2.3.3 est réduite de 75% et donc notée sur 2.25 points au lieu de 3 points
            # Si toutes les tâches sont faites, alors le score réalisé de cae_1.2.3 est de 2.25
            ActionStatut(ActionId("cae_1.2.3.3.1"), DetailedAvancement(1, 0, 0), True),
            ActionStatut(ActionId("cae_1.2.3.3.2"), DetailedAvancement(1, 0, 0), True),
            ActionStatut(ActionId("cae_1.2.3.3.3"), DetailedAvancement(1, 0, 0), True),
            ActionStatut(ActionId("cae_1.2.3.3.4"), DetailedAvancement(1, 0, 0), True),
            ActionStatut(ActionId("cae_1.2.3.3.5"), DetailedAvancement(1, 0, 0), True),
        ],
    )
    assert math.isclose(cae_scores_by_id["cae_1.2.3"].point_fait, 2.25)
    assert math.isclose(cae_scores_by_id["cae_3.3.5"].point_potentiel, 2)
    assert math.isclose(cae_scores_by_id["cae_3.3.5"].point_fait, 0)
