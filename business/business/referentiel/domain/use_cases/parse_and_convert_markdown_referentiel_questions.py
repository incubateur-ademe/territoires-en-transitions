from dataclasses import dataclass
from glob import glob
import os
from pathlib import Path
from typing import List, Literal, Optional, Tuple

from marshmallow import ValidationError
import marshmallow_dataclass

from business.referentiel.domain.models import events
from business.referentiel.domain.models.question import Choix, Question
from business.utils.action_id import ActionId
from business.utils.domain_message_bus import (
    AbstractDomainMessageBus,
)
from business.referentiel.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.utils.markdown_import.markdown_parser import (
    build_markdown_parser,
)
from business.utils.markdown_import.markdown_utils import load_md
from business.utils.use_case import UseCase


@dataclass
class MarkdownChoix:
    id: str
    titre: str


@dataclass
class MarkdownQuestion:
    """Question as defined in markdown files"""

    titre: str
    id: str
    type: Literal["binaire", "proportion", "choix"]
    thematique_id: str
    actions: Optional[List[str]]
    choix: Optional[List[MarkdownChoix]]
    description: str = ""


class ParseAndConvertMarkdownReferentielQuestions(UseCase):
    def __init__(
        self,
        bus: AbstractDomainMessageBus,
        referentiel_repo: AbstractReferentielRepository,
    ) -> None:
        self.bus = bus
        self.referentiel_repo = referentiel_repo
        self._markdown_question_schema = marshmallow_dataclass.class_schema(
            MarkdownQuestion
        )()

    def execute(
        self, trigger: events.ParseAndConvertMarkdownReferentielQuestionsTriggered
    ):
        md_files = glob(os.path.join(trigger.folder_path, "*.md"))
        print(f"Parsing {len(md_files)} files with questions")

        md_questions, parsing_errors = self.parse(md_files)

        if parsing_errors:
            self.bus.publish_event(
                events.QuestionMarkdownParsingOrConvertionFailed(
                    f"Incohérences dans le parsing de {len(parsing_errors)} questions: \n"
                    + "\n".join(parsing_errors)
                )
            )
            return

        questions, conversion_errors = self.convert(md_questions)

        if conversion_errors:
            self.bus.publish_event(
                events.QuestionMarkdownParsingOrConvertionFailed(
                    f"Incohérences dans la conversion de {len(conversion_errors)} questions: \n"
                    + "\n".join(conversion_errors)
                )
            )
            return

        self.bus.publish_event(events.QuestionMarkdownConvertedToEntities(questions))

    def parse(self, md_files: List[str]) -> Tuple[List[MarkdownQuestion], List[str]]:
        md_questions: List[MarkdownQuestion] = []
        parsing_errors: List[str] = []
        for md_file in md_files:
            md_questions_as_dict = self._build_md_questions_as_dict_from_md(md_file)
            for md_question_as_dict in md_questions_as_dict:
                try:
                    md_question = self._markdown_question_schema.load(
                        md_question_as_dict
                    )
                    md_questions.append(md_question)
                except ValidationError as error:
                    parsing_errors.append(f"In file {Path(md_file).name} {str(error)}")
        return md_questions, parsing_errors

    @staticmethod
    def _build_md_questions_as_dict_from_md(path: str) -> List[dict]:
        """Extract a question from a markdown document"""

        markdown = load_md(path)
        parser = build_markdown_parser(
            title_key="titre",
            description_key="description",
            initial_keyword="questions",
            keyword_node_builders={
                "questions": lambda: {"titre": "", "choix": []},
                "choix": lambda: {"titre": ""},
            },
        )
        question_as_dict = parser(markdown)
        return question_as_dict

    def convert(
        self, md_questions: List[MarkdownQuestion]
    ) -> Tuple[List[Question], List[str]]:
        errors = []

        # 1. Check that all referenced action_id exist
        repo_action_ids = self.referentiel_repo.get_all_action_ids()
        question_ids_refering_to_unknown_actions = [
            md_question.id
            for md_question in md_questions
            if md_question.actions
            and any(
                [action_id not in repo_action_ids for action_id in md_question.actions]
            )
        ]
        if question_ids_refering_to_unknown_actions:
            errors.append(
                f"Les questions suivantes font références à des actions inconnues: {', '.join(question_ids_refering_to_unknown_actions)}"
            )
        # 2. Check that if  type="choix", choix is not empty
        question_ids_with_missing_choix = [
            md_question.id
            for md_question in md_questions
            if md_question.type == "choix" and not md_question.choix
        ]
        if question_ids_with_missing_choix:
            errors.append(
                f"Les questions suivantes sont de types 'choix' mais ne spécifient aucun choix: {', '.join(question_ids_with_missing_choix)}"
            )

        if errors:
            return [], errors

        # 3. If none of the previous errors, convert to entities
        questions = [
            Question(
                id=md_question.id,
                formulation=md_question.titre,
                description=md_question.description,
                type=md_question.type,
                action_ids=[ActionId(action) for action in md_question.actions]
                if md_question.actions
                else [],
                choix=[
                    Choix(md_choix.id, md_choix.titre) for md_choix in md_question.choix
                ]
                if md_question.choix
                else None,
            )
            for md_question in md_questions
        ]

        return questions, errors
