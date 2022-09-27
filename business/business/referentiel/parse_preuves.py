from dataclasses import dataclass
from glob import glob
import json
import os
from pathlib import Path
from typing import List, Tuple


import marshmallow_dataclass
from marshmallow import ValidationError

from business.utils.markdown_import.markdown_parser import build_markdown_parser
from business.utils.markdown_import.markdown_utils import load_md


@dataclass
class Preuve:
    id: str
    nom: str
    actions: List[str]
    description: str = ""


def build_md_preuve_as_dict_from_md(path: str) -> List[dict]:
    """Extract an preuve from a markdown document"""

    markdown = load_md(path)
    parser = build_markdown_parser(
        title_key="nom",
        description_key="description",
        initial_keyword="preuves",
        keyword_node_builders={"preuves": lambda: {"nom": ""}},
    )
    preuves_as_dict = parser(markdown)
    return preuves_as_dict


markdown_preuve_schema = marshmallow_dataclass.class_schema(Preuve)()


def parse_preuves_from_markdown(md_file: str) -> Tuple[List[dict], List[str]]:
    md_preuves = build_md_preuve_as_dict_from_md(md_file)
    preuves = []
    errors = []
    for md_preuve in md_preuves:
        try:
            markdown_preuve_schema.load(md_preuve)
            preuves.append(md_preuve)
        except ValidationError as error:
            errors.append(f"Dans le fichier {Path(md_file).name} {str(error)}")
    return preuves, errors


def convert_preuves_markdown_folder_to_json(folder_path: str, json_filename: str):
    md_files = glob(os.path.join(folder_path, "*.md"))
    print(
        f"Lecture de {len(md_files)} fichiers preuves depuis le dossier {folder_path}."
    )
    preuves: List[dict] = []
    errors: List[str] = []
    for md_file in md_files:
        file_preuves, file_errors = parse_preuves_from_markdown(md_file)
        preuves += file_preuves
        errors += file_errors

    if errors:
        raise Exception(
            "Erreurs dans le format des fichiers preuves :" + "\n- ".join(errors)
        )

    with open(json_filename, "w") as f:
        json.dump(preuves, f)
    print(
        "Lecture et conversion réussies, le résultat JSON se trouve dans ",
        json_filename,
    )
