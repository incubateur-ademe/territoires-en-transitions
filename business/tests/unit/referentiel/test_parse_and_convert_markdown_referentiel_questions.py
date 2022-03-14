from re import A
from typing import Optional, List, Tuple
from business.referentiel.domain.models.question import Choix, Question

from business.referentiel.domain.use_cases.parse_and_convert_markdown_referentiel_questions import (
    ParseAndConvertMarkdownReferentielQuestions,
)
from business.utils.action_id import ActionId
from business.utils.domain_message_bus import (
    InMemoryDomainMessageBus,
)
from business.referentiel.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
    InMemoryReferentielRepository,
)
from business.referentiel.domain.models import events
from tests.utils.referentiel_factory import make_dummy_referentiel
from tests.utils.spy_on_event import spy_on_event


def prepare_use_case(
    folder_path: str,
    referentiel_repo: Optional[AbstractReferentielRepository] = None,
) -> Tuple[
    List[events.QuestionMarkdownParsingOrConvertionFailed],
    List[events.QuestionMarkdownConvertedToEntities],
]:
    test_command = events.ParseAndConvertMarkdownReferentielQuestionsTriggered(
        folder_path=folder_path
    )
    bus = InMemoryDomainMessageBus()
    referentiel_repo = referentiel_repo or InMemoryReferentielRepository()

    use_case = ParseAndConvertMarkdownReferentielQuestions(bus, referentiel_repo)

    failure_events = spy_on_event(bus, events.QuestionMarkdownParsingOrConvertionFailed)
    parsed_events = spy_on_event(bus, events.QuestionMarkdownConvertedToEntities)
    use_case.execute(test_command)
    return failure_events, parsed_events


def test_parse_and_convert_markdown_referentiel_questions_from_ok_folder():
    referentiel_repo = InMemoryReferentielRepository(
        *make_dummy_referentiel(
            action_ids=["eci_1", "eci_2"]
        )  # eci_1 and eci_2 are refered in some questions, so should exist in db
    )
    failure_events, parsed_events = prepare_use_case(
        "./tests/data/md_questions_example_ok", referentiel_repo=referentiel_repo
    )
    assert len(failure_events) == 0
    assert len(parsed_events) == 1

    actual_questions = parsed_events[0].questions

    assert actual_questions == [
        Question(
            id="question_1",
            formulation="Question 1 binaire",
            description="",
            action_ids=[],
            type="binaire",
            choix=None,
        ),
        Question(
            id="question_2",
            formulation="Question 2 proportion",
            description="",
            action_ids=[],
            type="proportion",
            choix=None,
        ),
        Question(
            id="question_3",
            formulation="Question 3 avec actions liées",
            description="",
            action_ids=[ActionId("eci_1"), ActionId("eci_2")],
            type="proportion",
            choix=None,
        ),
        Question(
            id="question_4",
            formulation="Question 4 choix",
            description="",
            action_ids=[],
            type="choix",
            choix=[
                Choix(id="question_4_a", formulation="Le premier choix"),
                Choix(id="question_4_b", formulation="Le second choix"),
            ],
        ),
        Question(
            id="question_5",
            formulation="Question 5 binaire",
            description="",
            action_ids=[],
            type="binaire",
            choix=None,
        ),
    ]


def test_parse_and_convert_markdown_referentiel_questions_when_wrong_type():
    failure_events, parsed_events = prepare_use_case(
        "./tests/data/md_questions_examples_nok/wrong_type"
    )
    assert len(failure_events) == 1
    assert len(parsed_events) == 0
    assert (
        failure_events[0].reason
        == "Incohérences dans le parsing de 1 questions: \nIn file question_example.md {'type': ['Must be one of: binaire, proportion, choix.']}"
    )


def test_parse_and_convert_markdown_referentiel_questions_when_choix_missing():

    failure_events, parsed_events = prepare_use_case(
        "./tests/data/md_questions_examples_nok/missing_choix"
    )
    assert len(failure_events) == 1
    assert len(parsed_events) == 0
    assert (
        failure_events[0].reason
        == "Incohérences dans la conversion de 1 questions: \nLes questions suivantes sont de types 'choix' mais ne spécifient aucun choix: question_missing_choix"
    )


def test_parse_and_convert_markdown_referentiel_questions_when_refering_to_unknown_action_ids():
    failure_events, parsed_events = prepare_use_case(
        "./tests/data/md_questions_examples_nok/refers_to_unknown_actions"
    )
    assert len(failure_events) == 1
    assert len(parsed_events) == 0
    assert (
        failure_events[0].reason
        == "Incohérences dans la conversion de 1 questions: \nLes questions suivantes font références à des actions inconnues: question_X"
    )
