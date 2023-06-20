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
from marshmallow import ValidationError
from business.utils.exceptions import MarkdownError

Programme = Literal["eci", "cae", "crte", "pcaet", "clef"]
Type = Literal["impact", "resultat"]


@dataclass
class MarkdownIndicateur:
    """Indicateur défini en markdown et yaml"""
    nom: str
    "Titre en markdown"

    description: str
    "Partie description en markdown"

    # Valeurs obligatoires de la partie yaml :
    id: str
    identifiant: Any
    unite: str

    # Valeurs optionnelles de la partie yaml :
    titre_long: Optional[str]
    obligation_cae: Optional[bool]
    obligation_eci: Optional[bool]
    valeur: Optional[str]
    actions: Optional[List[str]]
    programmes: Optional[List[Programme]]
    climat_pratic_ids: Optional[List[str]]
    participation_score: Optional[List[str]]
    source: Optional[str]
    thematiques: Optional[List[str]]
    fnv: Optional[List[str]]
    parent: Optional[str]
    type: Optional[str]


IndicateurGroup = Literal["eci", "cae", "crte"]


@dataclass
class Indicateur:
    """Indicateur en JSON"""
    id: str
    identifiant: str
    groupe: str
    nom: str
    unite: str
    description: str
    participation_score: bool
    titre_long: str
    thematiques: List[str]
    valeur_indicateur: Optional[str] = None
    parent: Optional[str] = None
    source: Optional[str] = None
    type: Optional[str] = None


def parse_indicateurs(
        path: str,
) -> Tuple[List[MarkdownIndicateur], List[str]]:
    """Extract a list of indicateurs from a Markdown document"""
    markdown_schema = marshmallow_dataclass.class_schema(MarkdownIndicateur)()

    md_files = glob(os.path.join(path, "*.md"))
    print(
        f"Lecture de {len(md_files)} fichiers indicateurs depuis le dossier {path} :) "
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
                md_indicateur = markdown_schema.load(md_indicateur_as_dict)
                md_indicateurs.append(md_indicateur)
            except ValidationError as error:
                parsing_errors.append(f"In file {Path(md_file).name} {str(error)}")
    return md_indicateurs, parsing_errors


def convert_indicateurs(path: str, json_filename: str):
    # Parse markdown folder
    md_indicateurs, errors = parse_indicateurs(path)

    # Raise if any errors
    if errors:
        raise MarkdownError(
            "Erreurs dans le format des fichiers indicateurs :\n- "
            + "\n- ".join(errors)
        )
    indicateurs = [
        Indicateur(
            id=md.id,
            identifiant=md.identifiant,
            groupe=md.id.split("_")[0],
            nom=md.nom,
            unite=md.unite,
            description=md.description,
            valeur_indicateur=md.valeur,
            participation_score=True if md.participation_score else False,
            titre_long=md.titre_long or md.nom,
            thematiques=md.thematiques or [],
            parent=md.parent,
            source=md.source,
            type=md.type
        )
        for md in md_indicateurs
    ]

    # Check that ids are unique
    duplicated_ids = find_duplicates(
        [indicateur.id for indicateur in indicateurs]
    )
    if duplicated_ids:
        raise AssertionError(
            "Les ids des indicateurs suivants ne sont pas uniques : "
            + ", ".join(duplicated_ids),
        )

    # Save to JSON
    with open(json_filename, "w") as f:
        json.dump(
            {"indicateurs": [asdict(indicateur) for indicateur in indicateurs]},
            f, indent=2, sort_keys=True
        )
    print(
        "Lecture et conversion réussies, le résultat JSON se trouve dans ",
        json_filename,
    )
