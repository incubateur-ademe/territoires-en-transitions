from business.utils.models.action_score import ActionScore
from business.utils.models.action_statut import (
    ActionStatut,
    DetailedAvancement,
)
from business.utils.models.actions import ActionId
from business.utils.models.personnalisation import ActionPersonnalisationConsequence
from business.utils.models.reponse import Reponse
from .fixtures import *

commune_id = 1
epci_id = 3810
dom_id = 5411  # Guadeloupe


def test_eci_desactivation_of_sous_action_242_should_redistribute_points_amongst_siblings(
    test_post_evaluate,
):
    # construit le payload avec des statuts et consequences
    statuts = []
    consequences = {
        ActionId("eci_2.4.2"): ActionPersonnalisationConsequence(desactive=True)
    }
    scores = test_post_evaluate("eci", statuts, consequences)

    # Action 2.4.2 is desactie, hence not concerne and worth 0 point.
    assert scores["eci_2.4.2"] == ActionScore(
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
        desactive=True,
        point_potentiel_perso=None,
    )

    # Points redistributed amongst the 4 non reglementaires siblings
    assert scores["eci_2.4.0"].point_potentiel == 0  # action réglementaire
    assert scores["eci_2.4.1"].point_potentiel == 5  # (4 + 1)
    assert scores["eci_2.4.2"].point_potentiel == 0  # desactive
    assert scores["eci_2.4.3"].point_potentiel == 3  # (2 + 1)
    assert scores["eci_2.4.4"].point_potentiel == 7  # (6 + 1)
    assert scores["eci_2.4.5"].point_potentiel == 5  # (4 + 1)

    # expect 2.4 still worth 20 points
    assert scores["eci_2.4"] == ActionScore(
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
        desactive=False,
        point_potentiel_perso=None,
    )


def test_cae_321_when_recuperation_cogeneration_is_NON(
    test_post_personnalize, test_post_evaluate
):
    """Si la récupération recuperation_cogeneration est NON, alors, cae_3.2.1.2 et cae_3.2.1.3 sont désactivées et cae_3.2.1.1 vaut 2 points"""

    reponses = [Reponse("recuperation_cogeneration", "NON")]
    consequences = test_post_personnalize(reponses)
    scores_cae = test_post_evaluate("cae", [], consequences)

    assert (
        scores_cae["cae_3.2.1"].point_potentiel
        == scores_cae["cae_3.2.1"].point_potentiel_perso
        == 2.0
    )
    assert scores_cae["cae_3.2.1.1"].point_potentiel == 2.0
    assert scores_cae["cae_3.2.1.2"].point_potentiel == 0
    assert scores_cae["cae_3.2.1.3"].point_potentiel == 0

    assert scores_cae["cae_3.2.1.2"].desactive == True
    assert scores_cae["cae_3.2.1.3"].desactive == True


def test_cae_631_when_dev_eco_2_is_0(test_post_personnalize, test_post_evaluate):
    """La réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de développement économique, dans la limite de 2 points de potentiel restant"""
    reponses = [Reponse("dev_eco_2", 0.0)]
    consequences = test_post_personnalize(reponses, IdentiteCollectivite({"commune"}))
    scores_cae = test_post_evaluate("cae", [], consequences)
    assert (
        scores_cae["cae_6.3.1"].point_potentiel
        == scores_cae["cae_6.3.1"].point_potentiel_perso
        == 2
    )


def test_cae_631_when_cae_6314_if_dev_eco_4_is_NON(
    test_post_personnalize, test_post_evaluate
):
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

    # Appel des deux endoints successivement
    reponses = [Reponse("dev_eco_4", "NON")]
    consequences = test_post_personnalize(reponses)
    scores_cae = test_post_evaluate("cae", [], consequences)

    assert (
        scores_cae["cae_6.3.1.4"].desactive
        and scores_cae["cae_6.3.1.4"].point_potentiel == 0.0
    )

    # cae_6.3.1.1 and cae_6.3.1.2 are not affected
    assert (
        scores_cae["cae_6.3.1.1"].point_potentiel
        == scores_cae["cae_6.3.1.1"].point_referentiel
    )

    assert (
        scores_cae["cae_6.3.1.2"].point_potentiel
        == scores_cae["cae_6.3.1.2"].point_referentiel
    )

    # cae_6.3.1.3 and cae_6.3.1.5 have been augmented of 1 point each
    assert (
        scores_cae["cae_6.3.1.3"].point_potentiel
        == scores_cae["cae_6.3.1.3"].point_referentiel + 1
    )
    assert (
        scores_cae["cae_6.3.1.5"].point_potentiel
        == scores_cae["cae_6.3.1.5"].point_referentiel + 1
    )

    # cae_6.3.1 remains unchanged
    assert (
        scores_cae["cae_6.3.1"].point_potentiel
        == scores_cae["cae_6.3.1"].point_referentiel
    )


def test_cae_641_when_localosation_dom_and_SAU_OUI(
    test_post_personnalize, test_post_evaluate
):
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
    # Appel des deux endoints successivement
    reponses = [Reponse("SAU", "OUI")]
    consequences = test_post_personnalize(
        reponses, IdentiteCollectivite(localisation={"DOM"})
    )
    scores_cae = test_post_evaluate("cae", [], consequences)

    # cae_6.4.1 reduite de 50%
    assert (
        scores_cae["cae_6.4.1"].point_potentiel_perso
        == scores_cae["cae_6.4.1"].point_potentiel
        == scores_cae["cae_6.4.1"].point_referentiel * 50 / 100
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
        assert (
            scores_cae[action_id_unchanged].point_potentiel
            == scores_cae[action_id_unchanged].point_referentiel * 50 / 100
        )

    # 6.4.1.6 passe de 15% à 20%
    assert (
        scores_cae["cae_6.4.1.6"].point_potentiel
        == scores_cae["cae_6.4.1"].point_potentiel * 20 / 100
    )

    # 6.4.1.8 passe de 15% à 10%
    assert (
        scores_cae["cae_6.4.1.8"].point_potentiel
        == scores_cae["cae_6.4.1"].point_potentiel * 10 / 100
    )


def test_cae_621_when_type_commune(test_post_personnalize, test_post_evaluate):
    """Reduction potentiel cae 6.2.1 liee logement-habitat

    Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de politique du logement et du cadre de vie, dans la limite de 2 points restant minimum.
    Si la commune participe au conseil d’administration d'un bailleur social, le potentiel, possiblement réduit est
    augmenté d'un point sur la 6.2.1
    """

    # Cas 1 :  Si une commune est à 10 % de l'EPCI et qu'elle participe au conseil d'administration d'un bailleur social, elle est notée sur 3 points
    # ------
    # si identite(type, commune) et reponse(habitat_3, OUI) et reponse(habitat_2, 10%)
    #    - cae 6.2.1 est réduite à 2 points et on lui ajoute 1 point, donc a un potentiel de 3 points

    reponses = [Reponse("habitat_3", "OUI"), Reponse("habitat_2", 0.1)]
    consequences = test_post_personnalize(
        reponses,
        IdentiteCollectivite(type={"commune"}),
    )
    scores_cae_1 = test_post_evaluate("cae", [], consequences)
    assert scores_cae_1["cae_6.2.1"].point_potentiel == 3.0

    # Cas 2 :  Si une commune est à 50 % de l'EPCI et qu'elle participe au conseil d'administration d'un bailleur social, elle est notée sur 6 points
    # -------
    # si identite(type, commune) et reponse(habitat_3, OUI) et reponse(habitat_2, 50%)
    #    - cae 6.2.1 est réduite de 50% et on lui ajoute 1 point, donc a un potentiel de 6 points

    reponses = [Reponse("habitat_3", "OUI"), Reponse("habitat_2", 0.5)]
    consequences = test_post_personnalize(
        reponses,
        IdentiteCollectivite(type={"commune"}),
    )
    scores_cae_2 = test_post_evaluate("cae", [], consequences)

    assert scores_cae_2["cae_6.2.1"].point_potentiel == 6.0

    # Cas 3 :  Si une commune est à 10 % de l'EPCI et qu'elle ne participe pas au conseil d'administration d'un bailleur social, elle est notée sur 2 points
    # ------
    # si identite(type, commune) et reponse(habitat_3, OUI) et reponse(habitat_2, 10%)
    #    - cae 6.2.1 est réduite à 2 points et on lui ajoute 1 point, donc a un potentiel de 3 points
    reponses = [Reponse("habitat_3", "NON"), Reponse("habitat_2", 0.1)]
    consequences = test_post_personnalize(
        reponses,
        IdentiteCollectivite(type={"commune"}),
    )
    scores_cae_3 = test_post_evaluate("cae", [], consequences)

    assert scores_cae_3["cae_6.2.1"].point_potentiel == 2.0


def test_cae_335_with_score_taken_into_account(
    test_post_personnalize, test_post_evaluate
):
    """Overide du score de cae_3.3.5 liée au score obtenue à l'action cae_1.2.3

    Pour une commune, la note est réduite à 2 points en l'absence de la compétence traitement des déchets.
    Pour un EPCI ayant transféré la compétence traitement des déchets à un syndicat compétent en la matière, la note est réduite proportionnelle à sa participation dans ce syndicat, dans la limite de 2 points restants.
    Pour favoriser la prévention des déchets, la note attribuée à cette action ne peut dépasser celle obtenue dans l'action 1.2.3.
    """
    # Cas 1 :  Si commune avec compétence déchets, il n'y a pas de réduction de potentiel.
    # ------
    reponses = [Reponse("dechets_2", "OUI")]
    statuts = [  # Quand reponse(dechets_2, OUI), cae_1.2.3 est réduit de 0.75, et est donc notée sur 7.5 points au lieu de 10 points.
        # La sous-action cae_1.2.3.3 représente 30% de l'action donc est noté sur 30% de 7.5 points, ce qui fait 2.25 points.
        ActionStatut(ActionId("cae_1.2.3.3.1"), DetailedAvancement(1, 0, 0), True),
        ActionStatut(ActionId("cae_1.2.3.3.2"), DetailedAvancement(1, 0, 0), True),
        ActionStatut(ActionId("cae_1.2.3.3.3"), DetailedAvancement(1, 0, 0), True),
        ActionStatut(ActionId("cae_1.2.3.3.4"), DetailedAvancement(1, 0, 0), True),
        ActionStatut(ActionId("cae_1.2.3.3.5"), DetailedAvancement(1, 0, 0), True),
        # La sous-action cae_3.3.5.3 vaut initiallement 4.8 points
        # Chaque tâche de cette sous-saction vaut 1.2 points, donc si une tâche est faite, score_realise(cae_3.3.5) = 1.2
        ActionStatut(ActionId("cae_3.3.5.3.1"), DetailedAvancement(1, 0, 0), True),
    ]
    consequences = test_post_personnalize(
        reponses, IdentiteCollectivite(type={"commune"})
    )
    scores_cae_1 = test_post_evaluate("cae", statuts, consequences)

    assert scores_cae_1["cae_1.2.3"].point_fait == 2.25
    assert scores_cae_1["cae_3.3.5"].point_fait == 1.20

    # Cas 2 :  Si commune avec compétence déchets, il n'y a pas de réduction de potentiel mais le score de la 3.3.5 est majoré par celui de la 1.2.3
    # ------
    reponses = [Reponse("dechets_2", "OUI")]
    statuts = [
        # La sous-action cae_3.3.5.3 vaut initialement 4.8 points
        # Chaque tâche de cette sous-saction vaut 1.2 points, donc si une tâche est faite, score_realise(cae_3.3.5) = 1.2
        # Aucune réponse pour cae_1.2.3 => score_realise(cae_1.2.3) = 0
        # La majoration du score de la 3.3.5 par la 1.2.3 entraîne donc que la 3.3.5 vaut a un score réalisé de 0 point.
        ActionStatut(ActionId("cae_3.3.5.3.1"), DetailedAvancement(1, 0, 0), True),
    ]
    consequences = test_post_personnalize(
        reponses, IdentiteCollectivite(type={"commune"})
    )
    scores_cae_2 = test_post_evaluate("cae", statuts, consequences)

    assert scores_cae_2["cae_1.2.3"].point_fait == 0.0
    assert scores_cae_2["cae_3.3.5"].point_fait == 0.0  # Au lieu de 1.2 !

    # Cas 3 :  Si EPCI sans compétence déchets et participation dans syndicat compétent de 10% et points_fait(cae_1.2.3, 2.25) alors potentiel(cae_3.3.5) = 2
    # ------
    reponses = [
        Reponse("dechets_1", "OUI"),
        Reponse("dechets_2", "NON"),
        Reponse("dechets_4", 0.1),
    ]
    statuts = [  # Quand reponse(dechets_2, NON), cae_1.2.3.3 est réduite de 75% et donc notée sur 2.25 points au lieu de 3 points
        # Si toutes les tâches sont faites, alors le score réalisé de cae_1.2.3 est de 2.25
        ActionStatut(ActionId("cae_1.2.3.3.1"), DetailedAvancement(1, 0, 0), True),
        ActionStatut(ActionId("cae_1.2.3.3.2"), DetailedAvancement(1, 0, 0), True),
        ActionStatut(ActionId("cae_1.2.3.3.3"), DetailedAvancement(1, 0, 0), True),
        ActionStatut(ActionId("cae_1.2.3.3.4"), DetailedAvancement(1, 0, 0), True),
        ActionStatut(ActionId("cae_1.2.3.3.5"), DetailedAvancement(1, 0, 0), True),
    ]
    consequences = test_post_personnalize(reponses, IdentiteCollectivite(type={"EPCI"}))
    scores_cae_3 = test_post_evaluate("cae", statuts, consequences)
    assert scores_cae_3["cae_1.2.3"].point_fait == 2.25
    assert scores_cae_3["cae_3.3.5"].point_potentiel == 2.0
    assert scores_cae_3["cae_3.3.5"].point_fait == 0.0

    # Cas 4 :  Si EPCI et non concernée à la 3.3.5, la règle n'a pas de conséquence
    # -----------------------------------------------------------------------------
    reponses = [Reponse("dechets_2", "NON"), Reponse("dechets_4", 0.1)]
    taches_cae_335 = (
        [ActionId(f"cae_3.3.5.1.{k}") for k in range(1, 7)]
        + [ActionId(f"cae_3.3.5.2.{k}") for k in range(1, 10)]
        + [ActionId(f"cae_3.3.5.3.{k}") for k in range(1, 5)]
    )
    statuts = [
        ActionStatut(tache_id, DetailedAvancement(0, 0, 0), False)
        for tache_id in taches_cae_335
    ]

    consequences = test_post_personnalize(reponses, IdentiteCollectivite(type={"EPCI"}))
    scores_cae_4 = test_post_evaluate("cae", statuts, consequences)
    assert scores_cae_4["cae_3.3.5"].concerne is False
    assert scores_cae_4["cae_3.3.5"].point_potentiel == 0
