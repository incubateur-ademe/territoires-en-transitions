import json
from dataclasses import asdict
from business.referentiel.check_regles_against_questions import (
    check_regles_against_questions,
)
from business.referentiel.parse_questions import convert_questions_markdown_folder
from business.referentiel.parse_regles import (
    convert_regles_from_markdown_folder,
)


def convert_questions_and_regles_from_markdown_folder(
    questions_folder_path: str, regles_folder_path: str, json_filename: str
):
    # Lecture et conversion des dossiers de markdowns de questions et de règles
    questions = convert_questions_markdown_folder(questions_folder_path)
    actions_regles = convert_regles_from_markdown_folder(regles_folder_path)

    # Vérification de la compatibilité entre les règles et les actions
    check_regles_against_questions(actions_regles, questions)

    # Sauvegarde dans un fichier JSON
    with open(json_filename, "w") as f:
        json.dump(
            {
                "questions": [asdict(question) for question in questions],
                "regles": [asdict(action_regles) for action_regles in actions_regles],
            },
            f,
        )
    print(
        "Lecture et conversion réussies, le résultat JSON se trouve dans ",
        json_filename,
    )
