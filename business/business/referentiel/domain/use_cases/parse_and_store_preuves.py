from glob import glob
import os
from pathlib import Path
from typing import List, Tuple


import marshmallow_dataclass
from marshmallow import ValidationError

from business.referentiel.domain.models.preuve import (
    Preuve,
)
from business.referentiel.domain.models import events
from business.utils.domain_message_bus import (
    AbstractDomainMessageBus,
    DomainFailureEvent,
)
from business.referentiel.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.utils.action_id import ActionId
from business.utils.markdown_import.markdown_parser import build_markdown_parser
from business.utils.markdown_import.markdown_utils import load_md
from business.utils.use_case import UseCase


class MarkdownPreuveInconsistent(Exception):
    pass


class ParseAndStorePreuves(UseCase):
    def __init__(
        self,
        bus: AbstractDomainMessageBus,
        referentiel_repo: AbstractReferentielRepository,
    ) -> None:
        self.bus = bus
        self.referentiel_repo = referentiel_repo
        self._markdown_preuve_schema = marshmallow_dataclass.class_schema(Preuve)()

    def execute(self, trigger: events.ParseAndStorePreuvesTriggered):
        md_files = glob(os.path.join(trigger.folder_path, "*.md"))
        print(
            f"Parsing {len(md_files)} files to build referentiel node from {trigger.folder_path}."
        )
        # parse
        preuves, parsing_errors = self.parse(md_files)

        if parsing_errors:
            self.bus.publish_event(
                DomainFailureEvent(
                    f"Incohérences dans le parsing de {len(parsing_errors)} preuves: \n"
                    + "\n".join(parsing_errors)
                )
            )
            return

        # check action_id exists
        action_ids = self.referentiel_repo.get_all_action_ids()
        preuve_referencing_unknown_actions = [
            (preuve.id, preuve.action_id)
            for preuve in preuves
            if preuve.action_id not in action_ids
        ]
        if preuve_referencing_unknown_actions:
            self.bus.publish_event(
                DomainFailureEvent(
                    "\n".join(
                        [
                            f"La preuve {preuve_id} référence l'action {action_id} qui n'existe pas."
                            for (
                                preuve_id,
                                action_id,
                            ) in preuve_referencing_unknown_actions
                        ]
                    )
                )
            )
            return
        self.referentiel_repo.upsert_preuves(preuves)

    def parse(self, md_files: List[str]) -> Tuple[List[Preuve], List[str]]:
        md_preuves: List[Preuve] = []
        parsing_errors: List[str] = []
        for md_file in md_files:
            md_preuves_as_dict = self._build_md_preuve_as_dict_from_md(md_file)
            for md_preuve_as_dict in md_preuves_as_dict:
                try:
                    md_preuve = self._markdown_preuve_schema.load(md_preuve_as_dict)
                    md_preuves.append(md_preuve)  # type: ignore
                except ValidationError as error:
                    parsing_errors.append(f"In file {Path(md_file).name} {str(error)}")
        return md_preuves, parsing_errors

    @staticmethod
    def _build_md_preuve_as_dict_from_md(path: str) -> List[dict]:
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

    @staticmethod
    def _infer_action_ids(md_action_ids: List[str]) -> List[ActionId]:
        return [ActionId(md_action_id) for md_action_id in md_action_ids]
