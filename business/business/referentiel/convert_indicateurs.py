import json
import os
from dataclasses import asdict, dataclass
from glob import glob
from pathlib import Path
from typing import Any, List, Literal, Optional, Tuple

import marshmallow_dataclass
from business.utils.find_duplicates import find_duplicates
from business.utils.markdown_import.markdown_parser import build_markdown_parser
from business.utils.markdown_import.markdown_utils import load_md
from business.utils.models.actions import ActionId
from marshmallow import ValidationError


@dataclass
class MarkdownIndicateur:
    """Indicateur as defined in markdown files"""

    id: str
    identifiant: Any  # str
    valeur: Optional[str]
    nom: str
    unite: str
    description: str
    obligation_cae: Optional[bool]
    actions: Optional[List[str]]
    programmes: Optional[List[str]]
    climat_pratic_ids: Optional[List[str]]
    source: Optional[str]
    obligation_eci: Optional[bool]


IndicateurGroup = Literal["eci", "cae", "crte"]


@dataclass
class Indicateur:
    """Indicateur as saved to JSON"""

    indicateur_id: str
    identifiant: str
    indicateur_group: IndicateurGroup
    nom: str
    unite: str
    action_ids: List[ActionId]
    description: str
    valeur_indicateur: Optional[str] = None
    obligation_eci: bool = False


def parse_markdown_indicateurs_from_folder(
    folder_path: str,
) -> Tuple[List[MarkdownIndicateur], List[str]]:
    """Extract a list of indicateurs from a markdown document"""
    markdown_indicateur_schema = marshmallow_dataclass.class_schema(
        MarkdownIndicateur
    )()

    md_files = glob(os.path.join(folder_path, "*.md"))
    print(
        f"Lecture de {len(md_files)} fichiers indicateurs depuis le dossier {folder_path} :) "
    )

    md_indicateurs: List[MarkdownIndicateur] = []
    parsing_errors: List[str] = []
    parser = build_markdown_parser(
        title_key="nom",
        description_key="description",
        initial_keyword="indicateurs",
        keyword_node_builders={"indicateurs": lambda: {"nom": ""}},
    )

    for md_file in md_files:
        markdown = load_md(md_file)
        md_indicateurs_as_dict = parser(markdown)

        for md_indicateur_as_dict in md_indicateurs_as_dict:
            try:
                md_indicateur = markdown_indicateur_schema.load(md_indicateur_as_dict)
                md_indicateurs.append(md_indicateur)  # type: ignore
            except ValidationError as error:
                parsing_errors.append(f"In file {Path(md_file).name} {str(error)}")
    return md_indicateurs, parsing_errors


def convert_indicateurs_markdown_folder_to_json(folder_path: str, json_filename: str):

    # Parse markdown folder
    md_indicateurs, errors = parse_markdown_indicateurs_from_folder(folder_path)

    # Raise if any errors
    if errors:
        raise MarkdownError(
            "Erreurs dans le format des fichiers indicateurs :\n- "
            + "\n- ".join(errors)
        )
    indicateurs = [
        Indicateur(
            indicateur_id=md_indicateur.id,
            identifiant=md_indicateur.identifiant,
            indicateur_group=md_indicateur.id.split("_")[0],  # type: ignore (TODO : fail if not in crte/cae/eci ?)
            nom=md_indicateur.nom,
            unite=md_indicateur.unite,
            action_ids=md_indicateur.actions,  # type: ignore
            description=md_indicateur.description,
            valeur_indicateur=None,
            obligation_eci=False,
        )
        for md_indicateur in md_indicateurs
    ]

    # Check that ids are unique
    duplicated_indicateurs_ids = find_duplicates(
        [indicateur.indicateur_id for indicateur in indicateurs]
    )
    if duplicated_indicateurs_ids:
        raise Exception(
            "Les ids des indicateurs suivants ne sont pas uniques : "
            + ", ".join(duplicated_indicateurs_ids),
        )

    # Save to JSON
    with open(json_filename, "w") as f:
        json.dump(
            {"indicateurs": [asdict(indicateur) for indicateur in indicateurs]}, f
        )
    print(
        "Lecture et conversion réussies, le résultat JSON se trouve dans ",
        json_filename,
    )
