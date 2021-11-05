from dataclasses import dataclass
import os
from glob import glob
from typing import Dict, List

import marshmallow_dataclass

from business.domain.models.indicateur import Programme, ClimatPraticId
from business.domain.models import commands, events
from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
)
from business.utils.markdown_import.markdown_parser import build_markdown_parser
from business.utils.markdown_import.markdown_utils import load_md
from .use_case import UseCase


class MarkdownIndicateurInconsistent(Exception):
    pass


@dataclass
class MarkdownIndicateur:
    """Indicateur as defined in markdown files"""

    nom: str
    identifiant: str
    unite: str
    description: str
    obligation_cae: bool
    actions: List[str]
    programmes: List[Programme]
    climat_pratic_ids: List[ClimatPraticId]


class ConvertMarkdownIndicateursToEntities(UseCase):
    points_round_digits = 2

    def __init__(self, bus: AbstractDomainMessageBus) -> None:
        self.bus = bus
        self._markdown_indicateur_schema = marshmallow_dataclass.class_schema(
            MarkdownIndicateur
        )()

    def execute(self, command: commands.ConvertMarkdownIndicateursToEntities):
        md_files = glob(os.path.join(command.folder_path, "*.md"))
        print(f"Parsing {len(md_files)} files to build referentiel node.")
        md_indicateurs = []
        for md_file in md_files:
            md_indicateurs_as_dict = self._build_md_indicateur_as_dict_from_md(md_file)
            for md_indicateur_as_dict in md_indicateurs_as_dict:
                md_indicateur = self._markdown_indicateur_schema.load(
                    md_indicateur_as_dict
                )
                md_indicateurs.append(md_indicateur)
        breakpoint()

    @staticmethod
    def _build_md_indicateur_as_dict_from_md(path: str) -> List[dict]:
        """Extract an action from a markdown document"""

        markdown = load_md(path)
        parser = build_markdown_parser(
            title_key="nom", children_key=None, description_key="description"
        )
        actions_as_dict = parser(markdown)
        return actions_as_dict
