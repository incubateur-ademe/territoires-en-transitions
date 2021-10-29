from glob import glob
import os
from typing import Callable, List

from backend.domain.ports.domain_message_bus import AbstractDomainMessageBus
from backend.domain.models import commands, events
from backend.domain.models.markdown_action_node import MarkdownActionNode
from backend.utils.markdown_import.markdown_parser import build_markdown_parser
from backend.utils.markdown_import.markdown_utils import load_md


class ParseMarkdownReferentielFolder:
    def __init__(self, bus: AbstractDomainMessageBus) -> None:
        self.bus = bus

    def execute(self, command: commands.ParseMarkdownReferentielFolder):
        md_files = glob(os.path.join(command.folder_path, "*.md"))

        actions = []
        for md_file in md_files:
            md_file_actions = self._build_actions_from_md(md_file)
            actions += md_file_actions

        referentiel_node = self._referentiel_from_actions(actions)
        self.bus.publish_event(
            events.MarkdownReferentielFolderParsed(referentiel_node=referentiel_node)
        )

    def _referentiel_from_actions(
        self,
        actions: List[MarkdownActionNode],
    ) -> MarkdownActionNode:
        """
        Nest actions into a root referentiel action.
        This function is tightly coupled with the way markdowns are organized in each referentiels directories
        """
        root_action = list(filter(self.is_root, actions))[0]  # TODO raise if no root
        regular_actions = list(filter(lambda action: not self.is_root(action), actions))

        sorted_actions = list(
            reversed(
                sorted(
                    regular_actions,
                    key=lambda action: len(action.identifiant.split(".")),
                )
            )
        )

        def level(node: MarkdownActionNode) -> int:
            return len(node.identifiant.split("."))

        for orphan in sorted_actions:
            if level(orphan) == 1:  # Axes
                root_action.actions.append(orphan)
            else:
                parents = list(
                    filter(
                        self.is_parent_of(orphan),
                        sorted_actions,
                    )
                )
                if len(parents) == 0:
                    self.bus.publish_event(
                        events.ParseMarkdownReferentielFolderFailed(
                            f"L'action {orphan.identifiant} est orpheline ! "
                        )
                    )
                # TODO : Test that orphan depth is indeed parent depth + 1. Else raise.

                parents[0].actions.append(orphan)

        return root_action

    @staticmethod
    def _build_actions_from_md(path: str) -> List[MarkdownActionNode]:
        """Extract an action from a markdown document"""

        markdown = load_md(path)
        parser = build_markdown_parser(
            title_key="nom", children_key="actions", description_key="description"
        )
        actions_as_dict = parser(markdown)

        return [
            MarkdownActionNode(**action_as_dict) for action_as_dict in actions_as_dict
        ]

    @staticmethod
    def is_parent_of(child: MarkdownActionNode) -> Callable[[MarkdownActionNode], bool]:
        return (
            lambda action: child.identifiant.startswith(action.identifiant)
            and action.identifiant != child.identifiant
        )

    @staticmethod
    def is_root(action: MarkdownActionNode) -> bool:
        return action.identifiant == ""
