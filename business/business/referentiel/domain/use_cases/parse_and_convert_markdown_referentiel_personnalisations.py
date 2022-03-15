from dataclasses import dataclass
from glob import glob
import os
from pathlib import Path
from typing import Dict, List, Literal, Tuple

from marshmallow import ValidationError
import marshmallow_dataclass

from business.referentiel.domain.models import events
from business.referentiel.domain.models.personnalisation import (
    Personnalisation,
    Regle,
    RegleType,
)
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


MarkdownPersonnalisationRegleTitre = Literal[
    "Désactivation", "Réduction de potentiel", "Score"
]


@dataclass
class MarkdownPersonnalisationRegle:
    formule: str
    description: str
    titre: MarkdownPersonnalisationRegleTitre


@dataclass
class MarkdownPersonnalisation:
    """Personnalisation as defined in markdown files"""

    action_id: str
    titre: str
    regles: List[MarkdownPersonnalisationRegle]
    description: str = ""


regle_titre_to_type: Dict[MarkdownPersonnalisationRegleTitre, RegleType] = {
    "Désactivation": "desactivation",
    "Réduction de potentiel": "reduction",
    "Score": "score",
}


class ParseAndConvertMarkdownReferentielPersonnalisations(UseCase):
    def __init__(
        self,
        bus: AbstractDomainMessageBus,
        referentiel_repo: AbstractReferentielRepository,
    ) -> None:
        self.bus = bus
        self.referentiel_repo = referentiel_repo
        self._markdown_personnalisation_schema = marshmallow_dataclass.class_schema(
            MarkdownPersonnalisation
        )()

    def execute(
        self,
        trigger: events.ParseAndConvertMarkdownReferentielPersonnalisationsTriggered,
    ):
        md_files = glob(os.path.join(trigger.folder_path, "*.md"))
        print(f"Parsing {len(md_files)} files with personnalisation")
        # parse
        md_personnalisation, parsing_errors = self.parse(md_files)

        if parsing_errors:
            self.bus.publish_event(
                events.PersonnalisationMarkdownParsingOrConvertionFailed(
                    f"Incohérences dans le parsing de {len(parsing_errors)} regles: \n"
                    + "\n".join(parsing_errors)
                )
            )
            return

        # convert
        personnalisation, conversion_errors = self.convert(md_personnalisation)

        if conversion_errors:
            self.bus.publish_event(
                events.PersonnalisationMarkdownParsingOrConvertionFailed(
                    f"Incohérences dans la conversion de {len(conversion_errors)} regles: \n"
                    + "\n".join(conversion_errors)
                )
            )
            return

        self.bus.publish_event(
            events.PersonnalisationMarkdownConvertedToEntities(personnalisation)
        )

    def parse(
        self, md_files: List[str]
    ) -> Tuple[List[MarkdownPersonnalisation], List[str]]:
        md_personnalisations: List[MarkdownPersonnalisation] = []
        parsing_errors: List[str] = []
        for md_file in md_files:
            md_personnalisation_as_dicts = (
                self._build_md_personnalisation_as_dict_from_md(md_file)
            )
            for md_personnalisation_as_dict in md_personnalisation_as_dicts:
                try:
                    md_personnalisation = self._markdown_personnalisation_schema.load(
                        md_personnalisation_as_dict
                    )
                    md_personnalisations.append(md_personnalisation)  # type: ignore
                except ValidationError as error:
                    parsing_errors.append(f"In file {Path(md_file).name} {str(error)}")
        return md_personnalisations, parsing_errors

    @staticmethod
    def _build_md_personnalisation_as_dict_from_md(path: str) -> List[dict]:
        """Extract a question from a markdown document"""

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
        question_as_dict = parser(markdown)
        return question_as_dict

    def convert(
        self, md_personnalisations: List[MarkdownPersonnalisation]
    ) -> Tuple[List[Personnalisation], List[str]]:
        errors = []
        # 1. Check that all referenced action_id exist
        repo_action_ids = self.referentiel_repo.get_all_action_ids()
        unknown_action_ids = [
            md_personnalisation.action_id
            for md_personnalisation in md_personnalisations
            if md_personnalisation.action_id not in repo_action_ids
        ]
        if unknown_action_ids:
            errors.append(
                f"Les règles suivantes'appliquent à des actions inconnues: {', '.join(unknown_action_ids)}"
            )
            return [], errors

        # 2. todo : check that formule is correct (??)
        personnalisation = [
            Personnalisation(
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

        return personnalisation, []
