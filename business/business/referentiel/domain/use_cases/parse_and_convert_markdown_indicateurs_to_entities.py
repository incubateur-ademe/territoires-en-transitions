from dataclasses import dataclass
from glob import glob
import os
from pathlib import Path
from typing import Any, List, Optional, Tuple


import marshmallow_dataclass
from marshmallow import ValidationError
from business.referentiel.domain.models.referentiel import action_referentiel_options

from business.referentiel.domain.models.indicateur import (
    Indicateur,
    IndicateurGroup,
    IndicateurId,
)
from business.referentiel.domain.models import events
from business.utils.domain_message_bus import (
    AbstractDomainMessageBus,
)
from business.referentiel.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.utils.action_id import ActionId
from business.utils.markdown_import.markdown_parser import build_markdown_parser
from business.utils.markdown_import.markdown_utils import load_md
from business.utils.use_case import UseCase


class MarkdownIndicateurInconsistent(Exception):
    pass


@dataclass
class MarkdownIndicateur:
    """Indicateur as defined in markdown files"""

    id: str
    identifiant: Any  # TODO : should be string
    valeur: Optional[str]
    nom: str
    unite: str
    description: str
    obligation_cae: Optional[bool]
    actions: Optional[List[str]]
    programmes: Optional[List[str]]
    climat_pratic_ids: Optional[List[str]]
    source: Optional[str]  # TODO : should we transfert ?
    obligation_eci: Optional[bool]  # TODO : should we transfert ?


class ParseAndConvertMarkdownIndicateursToEntities(UseCase):
    points_round_digits = 2

    def __init__(
        self,
        bus: AbstractDomainMessageBus,
        referentiel_repo: AbstractReferentielRepository,
    ) -> None:
        self.bus = bus
        self.referentiel_repo = referentiel_repo
        self._markdown_indicateur_schema = marshmallow_dataclass.class_schema(
            MarkdownIndicateur
        )()

    def execute(
        self, trigger: events.ParseAndConvertMarkdownIndicateursToEntitiesTriggered
    ):
        md_files = glob(os.path.join(trigger.folder_path, "*.md"))
        print(f"Parsing {len(md_files)} files to build referentiel node.")
        # parse
        md_indicateurs, parsing_errors = self.parse(md_files)

        if parsing_errors:
            self.bus.publish_event(
                events.IndicateurMarkdownParsingOrConvertionFailed(
                    f"Incohérences dans le parsing de {len(parsing_errors)} indicateurs: \n"
                    + "\n".join(parsing_errors)
                )
            )
            return
        # convert
        indicateurs, conversion_errors = self.convert(
            md_indicateurs, trigger.referentiel
        )

        if conversion_errors:
            self.bus.publish_event(
                events.IndicateurMarkdownParsingOrConvertionFailed(
                    f"Incohérences dans la conversion de {len(conversion_errors)} indicateurs: \n"
                    + "\n".join(conversion_errors)
                )
            )
        else:
            self.bus.publish_event(
                events.IndicateurMarkdownConvertedToEntities(
                    indicateurs=indicateurs, referentiel=trigger.referentiel
                )
            )

    def parse(self, md_files: List[str]) -> Tuple[List[MarkdownIndicateur], List[str]]:
        md_indicateurs: List[MarkdownIndicateur] = []
        parsing_errors: List[str] = []
        for md_file in md_files:
            md_indicateurs_as_dict = self._build_md_indicateur_as_dict_from_md(md_file)
            for md_indicateur_as_dict in md_indicateurs_as_dict:
                try:
                    md_indicateur = self._markdown_indicateur_schema.load(
                        md_indicateur_as_dict
                    )
                    md_indicateurs.append(md_indicateur)
                except ValidationError as error:
                    parsing_errors.append(f"In file {Path(md_file).name} {str(error)}")
        return md_indicateurs, parsing_errors

    def convert(
        self,
        md_indicateurs: List[MarkdownIndicateur],
        indicateur_group: IndicateurGroup,
    ) -> Tuple[List[Indicateur], List[str]]:
        repo_action_ids = (
            self.referentiel_repo.get_all_action_ids(indicateur_group)
            if indicateur_group in action_referentiel_options
            else []
        )

        repo_indicateur_ids = self.referentiel_repo.get_all_indicateur_ids()
        indicateurs: List[Indicateur] = []
        errors: List[str] = []
        for md_indicateur in md_indicateurs:
            try:
                indicateurs.append(
                    self._to_entity(
                        md_indicateur,
                        repo_action_ids,
                        repo_indicateur_ids,
                        indicateur_group,
                    )
                )
            except MarkdownIndicateurInconsistent as error:
                errors.append(str(error))
        return indicateurs, errors

    def _to_entity(
        self,
        md_indicateur: MarkdownIndicateur,
        repo_action_ids: List[ActionId],
        repo_indicateur_ids: List[IndicateurId],
        indicateur_group: IndicateurGroup,
    ) -> Indicateur:
        refered_indicateur_id = md_indicateur.valeur
        if refered_indicateur_id and refered_indicateur_id not in repo_indicateur_ids:
            raise MarkdownIndicateurInconsistent(
                f"L'indicateur {md_indicateur.id} référence dans `valeur` un id d'indicateur qui n'existe pas dans la base de données: {refered_indicateur_id}"
            )
        refered_action_ids = self._infer_action_ids(md_indicateur.actions or [])
        if not all(
            [
                refered_action_id in repo_action_ids
                for refered_action_id in refered_action_ids
            ]
        ):
            raise MarkdownIndicateurInconsistent(
                f"L'indicateur {md_indicateur.id} référence des actions qui n'existent pas dans la base de donnée: {', '.join([action_id for action_id in refered_action_ids if action_id not in repo_action_ids])}."
            )

        return Indicateur(
            indicateur_id=IndicateurId(md_indicateur.id),
            indicateur_group=indicateur_group,
            identifiant=md_indicateur.identifiant,
            nom=md_indicateur.nom,
            description=md_indicateur.description,
            unite=md_indicateur.unite,
            action_ids=refered_action_ids,
        )

    @staticmethod
    def _build_md_indicateur_as_dict_from_md(path: str) -> List[dict]:
        """Extract an indicateur from a markdown document"""

        markdown = load_md(path)
        parser = build_markdown_parser(
            title_key="nom",
            description_key="description",
            initial_keyword="indicateurs",
            keyword_node_builders={"indicateurs": lambda: {"nom": ""}},
        )
        indicateurs_as_dict = parser(markdown)
        return indicateurs_as_dict

    @staticmethod
    def _infer_action_ids(md_action_ids: List[str]) -> List[ActionId]:
        return [ActionId(md_action_id) for md_action_id in md_action_ids]
