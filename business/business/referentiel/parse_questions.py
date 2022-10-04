import json
import os
from dataclasses import asdict, dataclass
from glob import glob
from pathlib import Path
from typing import List, Literal, Optional, Tuple

import marshmallow_dataclass
from business.utils.exceptions import MarkdownError
from business.utils.find_duplicates import find_duplicates
from business.utils.markdown_import.markdown_parser import (
    build_markdown_parser,
    MarkdownParserError,
)
from business.utils.models.questions import CollectiviteType, Question, Choix
from business.utils.markdown_import.markdown_utils import load_md
from business.utils.models.actions import ActionId
from marshmallow import ValidationError


@dataclass
class MarkdownChoix:
    """Choix comme défini dans les fichiers markdown"""

    id: str
    titre: str
    ordonnancement: Optional[int] = None


@dataclass
class MarkdownQuestion:
    """Question comme défini dans les fichiers markdown"""

    titre: str
    id: str
    type: Literal["binaire", "proportion", "choix"]
    thematique_id: str
    actions: Optional[List[str]]
    choix: Optional[List[MarkdownChoix]]
    types_concernes: Optional[List[CollectiviteType]]
    description: str = ""
    ordonnancement: Optional[int] = None


def parse_markdown_questions_from_folder(
    folder_path: str,
) -> Tuple[List[MarkdownQuestion], List[str]]:
    """Extract a list of questions from a markdown document"""
    markdown_question_schema = marshmallow_dataclass.class_schema(MarkdownQuestion)()

    md_files = glob(os.path.join(folder_path, "*.md"))
    print(
        f"Lecture de {len(md_files)} fichiers questions depuis le dossier {folder_path} :) "
    )

    md_questions: List[MarkdownQuestion] = []
    errors: List[str] = []
    for md_file in md_files:
        md_questions_as_dict = _build_md_questions_as_dict_from_md(md_file)
        for md_question_as_dict in md_questions_as_dict:
            try:
                md_question = markdown_question_schema.load(md_question_as_dict)
                md_questions.append(md_question)  # type: ignore
            except (ValidationError, MarkdownParserError) as error:
                errors.append(f"Dans le fichier {Path(md_file).name} {str(error)}")
    return md_questions, errors


def convert_questions_markdown_folder(folder_path: str) -> list[Question]:

    # Parse les fichiers markdowns
    md_questions, errors = parse_markdown_questions_from_folder(folder_path)

    # Plante si y a des erreurs
    if errors:
        raise MarkdownError(
            "Erreurs dans le format des fichiers questions :\n- " + "\n- ".join(errors)
        )

    # Vérifie les données
    _check_md_questions_consistency(md_questions)

    # Convertie en objet Question
    questions = [
        Question(
            id=md_question.id,
            formulation=md_question.titre,
            description=md_question.description,
            thematique_id=md_question.thematique_id,
            type=md_question.type,
            action_ids=[ActionId(action) for action in md_question.actions]
            if md_question.actions
            else [],
            ordonnnancement=md_question.ordonnancement,
            types_collectivites_concernees=md_question.types_concernes,
            choix=[
                Choix(md_choix.id, md_choix.titre, md_choix.ordonnancement)
                for md_choix in md_question.choix
            ]
            if md_question.choix
            else None,
        )
        for md_question in md_questions
    ]
    return questions


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


def _check_md_questions_consistency(md_questions: list[MarkdownQuestion]):
    # 1. que les ids sont uniques
    duplicated_questions_ids = find_duplicates(
        [question.id for question in md_questions]
    )
    if duplicated_questions_ids:
        raise MarkdownError(
            "Les ids des questions suivants ne sont pas uniques : "
            + ", ".join(duplicated_questions_ids),
        )
    # 2. que si  type="choix", des choix sont donnés
    question_ids_with_missing_choix = [
        md_question.id
        for md_question in md_questions
        if md_question.type == "choix" and not md_question.choix
    ]
    if question_ids_with_missing_choix:
        raise MarkdownError(
            f"Les questions suivantes sont de types 'choix' mais ne spécifient aucun choix: {', '.join(question_ids_with_missing_choix)}"
        )
