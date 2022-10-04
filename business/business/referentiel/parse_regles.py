import os
from dataclasses import dataclass
from glob import glob
from pathlib import Path
from typing import List, Literal, Tuple, Dict

import marshmallow_dataclass
from business.utils.find_duplicates import find_duplicates
from business.utils.markdown_import.markdown_parser import (
    build_markdown_parser,
    MarkdownParserError,
)
from business.utils.markdown_import.markdown_utils import load_md
from business.utils.models.actions import ActionId
from marshmallow import ValidationError

from business.utils.models.regles import RegleType, ActionRegles, Regle

# Literals
# ---------
MarkdownPersonnalisationRegleTitre = Literal[
    "Désactivation", "Réduction de potentiel", "Score réalisé"
]


# Markdown structure
# -------------------
@dataclass
class MarkdownPersonnalisationRegle:
    """Regle de personnalisation, comme définie dans les markdowns"""

    formule: str
    description: str
    titre: MarkdownPersonnalisationRegleTitre


@dataclass
class MarkdownPersonnalisation:
    """Personnalisation pour une action, comme définie dans les markdowns, contenant une liste de regles (une seule par type !)"""

    action_id: str
    titre: str
    regles: List[MarkdownPersonnalisationRegle]
    description: str = ""


regle_titre_to_type: Dict[MarkdownPersonnalisationRegleTitre, RegleType] = {
    "Désactivation": "desactivation",
    "Réduction de potentiel": "reduction",
    "Score réalisé": "score",
}


def parse_markdown_regles_from_folder(
    folder_path: str,
) -> Tuple[List[MarkdownPersonnalisation], List[str]]:
    """Extract a list of personnalisations from a markdown document"""
    markdown_personnalisation_schema = marshmallow_dataclass.class_schema(
        MarkdownPersonnalisation
    )()

    md_files = glob(os.path.join(folder_path, "*.md"))
    print(
        f"Lecture de {len(md_files)} fichiers règles depuis le dossier {folder_path} :) "
    )

    md_personnalisations: List[MarkdownPersonnalisation] = []
    errors: List[str] = []
    for md_file in md_files:
        md_personnalisations_as_dict = _build_md_personnalisations_as_dict_from_md(
            md_file
        )
        for md_personnalisation_as_dict in md_personnalisations_as_dict:
            try:
                md_personnalisation = markdown_personnalisation_schema.load(
                    md_personnalisation_as_dict
                )
                md_personnalisations.append(md_personnalisation)  # type: ignore
            except (ValidationError, MarkdownParserError) as error:
                errors.append(f"Dans le fichier {Path(md_file).name} {str(error)}")
    return md_personnalisations, errors


def convert_regles_from_markdown_folder(folder_path: str):

    # Parse le dossier de markdowns
    md_personnalisations, errors = parse_markdown_regles_from_folder(folder_path)

    # Plante si y a des erreurs
    if errors:
        raise Exception(
            "Erreurs dans le format des fichiers personnalisations :\n- "
            + "\n- ".join(errors)
        )

    # Converti dans le format de sortie
    personnalisations = [
        ActionRegles(
            action_id=ActionId(md_personnalisation.action_id),
            titre=md_personnalisation.titre,
            regles=[
                Regle(
                    description=md_regle.description,
                    formule=md_regle.formule,
                    type=regle_titre_to_type[md_regle.titre],
                )
                for md_regle in md_personnalisation.regles
            ],
            description=md_personnalisation.description,
        )
        for md_personnalisation in md_personnalisations
    ]

    # Vérifie que les règles de personnalisations sont correctes
    _check_personnalisations_consistency(personnalisations)

    return personnalisations


def _build_md_personnalisations_as_dict_from_md(path: str) -> List[dict]:
    """Extrait une liste de personnalisations depuis un document markdown"""

    markdown = load_md(path)
    parser = build_markdown_parser(
        title_key="titre",
        description_key="description",
        initial_keyword="personnalisation",
        keyword_node_builders={
            "personnalisation": lambda: {
                "titre": "",
                "description": "",
                "regles": [],
            },
            "regles": lambda: {
                "description": "",
                "titre": "",
            },
        },
    )
    personnalisation_as_dict = parser(markdown)
    return personnalisation_as_dict


def _check_personnalisations_consistency(
    actions_regles: list[ActionRegles],
):

    personnalisation_action_ids = [
        action_regles.action_id for action_regles in actions_regles
    ]
    duplicated_action_ids = find_duplicates(personnalisation_action_ids)
    if duplicated_action_ids:
        raise Exception(
            f"Duplicats dans les règles pour les actions {', '.join(duplicated_action_ids)} ."
        )

    action_ids_with_duplicated_regles_types = [
        action_regles.action_id
        for action_regles in actions_regles
        if find_duplicates([regle.type for regle in action_regles.regles])
    ]
    if action_ids_with_duplicated_regles_types:
        raise Exception(
            f"Duplicats dans les types (désactivation, réduction, score) pour les règles des actions suivantes {', '.join(action_ids_with_duplicated_regles_types)}. Il ne faut qu'une seule formule par type et par action. "
        )
