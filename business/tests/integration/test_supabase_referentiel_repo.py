from business.evaluation.adapters import supabase_names

from business.referentiel.adapters.supabase_referentiel_repo import (
    SupabaseReferentielRepository,
)
from business.referentiel.domain.models.action_relation import ActionRelation
from business.referentiel.domain.models.personnalisation import (
    ActionPersonnalisationRegles,
    Regle,
)
from business.referentiel.domain.models.question import Choix, Question
from business.utils.action_id import ActionId
from tests.utils.referentiel_factory import (
    make_action_definition,
    make_action_points,
    make_indicateur,
)
from business.personnalisation.models import Question as QuestionEngine
from tests.utils.supabase_fixtures import *


def test_can_add_indicateurs(
    supabase_referentiel_repo: SupabaseReferentielRepository, supabase_client
):
    # Act : Add those indicateurs
    indicateur_1 = make_indicateur(
        indicateur_id="test_1",
        indicateur_group="eci",
        description="les poissons !",
        action_ids=[],
    )
    indicateur_2 = make_indicateur(
        indicateur_id="test_2",
        indicateur_group="eci",
        description="le bleu d'la mer :) ",
        action_ids=["eci_1"],
    )
    supabase_referentiel_repo.upsert_indicateurs([indicateur_1, indicateur_2])

    # Assert :
    # 1. check that the indicateurs exist in DB
    defs = supabase_client.db.get_by(
        supabase_names.tables.indicateur_definition, {"id": "like.test%"}
    )
    assert len(defs) == 2

    # 2. check that indicateur_action exist in DB
    indic_actions = supabase_client.db.get_by(
        supabase_names.tables.indicateur_action, {"indicateur_id": "eq.test_2"}
    )
    assert len(indic_actions) == 1


def test_can_update_indicateurs(
    supabase_referentiel_repo: SupabaseReferentielRepository,
    supabase_client: SupabaseClient,
):
    # Prepare : add an indicateur
    existing_indicateur = make_indicateur(
        indicateur_id="test_8",
    )
    supabase_referentiel_repo.upsert_indicateurs([existing_indicateur])

    # Act : Update this indicateur
    updated_indicateur = make_indicateur(
        indicateur_id=existing_indicateur.indicateur_id,
        description="un truc a changé ",
    )
    supabase_referentiel_repo.upsert_indicateurs([updated_indicateur])

    # Assert :
    # 1. check that the indicateurs exist in DB
    defs = supabase_client.db.get_by(
        supabase_names.tables.indicateur_definition,
        {"id": f"eq.{existing_indicateur.indicateur_id}"},
    )
    assert defs[0]["description"] == updated_indicateur.description


def test_can_update_actions(
    supabase_referentiel_repo: SupabaseReferentielRepository,
    supabase_client: SupabaseClient,
):
    # Prepare : add an action_children (but no def and no point)
    action_id = "test"
    referentiel = "eci"
    supabase_client.db.insert(
        supabase_names.tables.action_relation,
        {"referentiel": referentiel, "id": action_id, "parent": None},
    )
    supabase_client.db.insert(
        supabase_names.tables.action_definition,
        {
            "action_id": action_id,
            "referentiel": "eci",
            "identifiant": "old stuff",
            "nom": "old stuff",
            "description": "old stuff",
            "contexte": "old stuff",
            "exemples": "old stuff",
            "ressources": "old stuff",
            "perimetre_evaluation": "old stuff",
            "reduction_potentiel": "old stuff",
            "points": 42,
            "pourcentage": 42,
            "categorie": None,
        },
    )
    supabase_client.db.insert(
        supabase_names.tables.action_computed_points,
        {
            "action_id": action_id,
            "value": 23,
        },
    )
    # Act : Update this action giving it a def and point
    updated_def = make_action_definition(
        action_id=action_id,
        referentiel=referentiel,
        description="new stuff",
        reduction_potentiel="new stuff",
        perimetre_evaluation="new stuff",
        categorie="mise en œuvre",
    )
    updated_point = make_action_points(action_id=action_id, points=42)

    supabase_referentiel_repo.update_referentiel_actions([updated_def], [updated_point])

    # Assert :
    # 1. check that the definition exist in DB
    defs = supabase_client.db.get_by(
        supabase_names.tables.action_definition,
        {"action_id": f"eq.{action_id}"},
    )
    assert len(defs) == 1
    assert defs[0]["description"] == updated_def.description
    assert defs[0]["reduction_potentiel"] == updated_def.reduction_potentiel
    assert defs[0]["perimetre_evaluation"] == updated_def.perimetre_evaluation
    assert defs[0]["categorie"] == updated_def.categorie

    # 2. check that the point exist in DB
    points = supabase_client.db.get_by(
        supabase_names.tables.action_computed_points,
        {"action_id": f"eq.{action_id}"},
    )
    assert len(points) == 1
    assert points[0]["value"] == updated_point.value


def test_can_upsert_referentiel_questions(
    supabase_referentiel_repo: SupabaseReferentielRepository,
    supabase_client: SupabaseClient,
):
    question_id = "test_question"

    # Prepare : Add an action_children (to then be able to link a question to it)
    action_id = ActionId("test_1")
    referentiel = "eci"
    supabase_client.db.insert(
        supabase_names.tables.action_relation,
        {"referentiel": referentiel, "id": action_id, "parent": None},
    )

    # Act : upsert a question
    question = Question(
        id=question_id,
        formulation="Est-ce que la collectivité est compétente en voirie ?",
        description="Une petite description",
        thematique_id="dechets",
        action_ids=[action_id],
        type="choix",
        types_collectivites_concernees=["EPCI"],
        ordonnnancement=3,
        choix=[
            Choix(
                id="question_a",
                formulation="Oui",
                ordonnancement=1,
            ),
            Choix(
                id="question_b",
                formulation="Non",
                ordonnancement=2,
            ),
        ],
    )

    supabase_referentiel_repo.upsert_questions([question])

    # Assert :
    # 1. Check that the question is there
    questions = supabase_client.db.get_by(
        supabase_names.tables.question,
        {"id": f"eq.{question_id}"},
    )
    assert len(questions) == 1

    # 2. Check that the choix is there
    choix = supabase_client.db.get_by(
        supabase_names.tables.question_choix,
        {"question_id": f"eq.{question_id}"},
    )
    assert len(choix) == 2

    # 3. Check that the link to action is there
    question_action = supabase_client.db.get_by(
        supabase_names.tables.question_action,
        {"question_id": f"eq.{question_id}"},
    )
    assert len(question_action) == 1


def test_can_get_engine_actions(
    supabase_referentiel_repo: SupabaseReferentielRepository,
):
    retrieved_fake_engine_actions = supabase_referentiel_repo.get_all_engine_questions()
    assert len(retrieved_fake_engine_actions) > 5
    assert isinstance(retrieved_fake_engine_actions[0], QuestionEngine)


def test_can_replace_and_retrieve_referentiel_personnalisations(
    supabase_referentiel_repo: SupabaseReferentielRepository,
    supabase_client: SupabaseClient,
):
    # Prepare : add an action_children (to then be able to link a question to it)
    action_id = ActionId("test_1")
    referentiel = "eci"
    supabase_client.db.insert(
        supabase_names.tables.action_relation,
        {"referentiel": referentiel, "id": action_id, "parent": None},
    )

    # Act : upsert a personnalisation to this action
    personnalisation = ActionPersonnalisationRegles(
        action_id=action_id,
        description="une description",
        titre="la personnalisation",
        regles=[
            Regle(
                description="une description de la regle de désactivation",
                formule="reponse(dechets_1, NON)",
                type="desactivation",
            ),
            Regle(
                description="une description de la regle de réduction",
                formule="si reponse(dechets_1, OUI) alors reponse(dechets_2)",
                type="reduction",
            ),
        ],
    )
    supabase_referentiel_repo.replace_personnalisations([personnalisation])

    # Assert
    # 1. Check that the personnalisation is there
    personnalisation = supabase_client.db.get_by(
        supabase_names.tables.personnalisation,
        {"action_id": f"eq.{action_id}"},
    )
    assert len(personnalisation) == 1

    # 2. Check that the 2 regles are there
    regles = supabase_client.db.get_by(
        supabase_names.tables.personnalisation_regle,
        {"action_id": f"eq.{action_id}"},
    )
    assert len(regles) == 2


def test_can_insert_actions(
    supabase_referentiel_repo: SupabaseReferentielRepository,
    supabase_client: SupabaseClient,
):
    action_id = ActionId("testCREATE")
    referentiel = "eci"

    # Act :
    action_def = make_action_definition(
        action_id=action_id,
        referentiel=referentiel,
        description="description",
        reduction_potentiel="reduction",
        perimetre_evaluation="perimetre",
        categorie="effets",
    )
    action_point = make_action_points(action_id=action_id, points=42)
    action_relation = ActionRelation("eci", action_id, None)

    supabase_referentiel_repo.add_referentiel_actions(
        [action_def], [action_relation], [action_point]
    )

    # Assert :
    # 1. check that the definition exist in DB
    defs = supabase_client.db.get_by(
        supabase_names.tables.action_definition,
        {"action_id": f"eq.{action_id}"},
    )
    assert len(defs) == 1
    assert defs[0]["description"] == action_def.description
    assert defs[0]["reduction_potentiel"] == action_def.reduction_potentiel
    assert defs[0]["perimetre_evaluation"] == action_def.perimetre_evaluation
    assert defs[0]["categorie"] == action_def.categorie

    # 2. check that the point exist in DB
    points = supabase_client.db.get_by(
        supabase_names.tables.action_computed_points,
        {"action_id": f"eq.{action_id}"},
    )
    assert len(points) == 1
    assert points[0]["value"] == action_point.value
