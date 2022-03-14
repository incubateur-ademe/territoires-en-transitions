import os
from glob import glob
from typing import Callable, List, Optional

from pydantic import ValidationError
from tqdm import tqdm

from business.referentiel.domain.models import events
from business.referentiel.domain.models.markdown_action_node import MarkdownActionNode
from business.utils.domain_message_bus import AbstractDomainMessageBus
from business.utils.markdown_import.markdown_parser import build_markdown_parser
from business.utils.markdown_import.markdown_utils import load_md
from business.utils.use_case import UseCase
from business.utils.timeit import timeit


class ParseMarkdownReferentielFolder(UseCase):
    def __init__(self, bus: AbstractDomainMessageBus) -> None:
        self.bus = bus

    @timeit("ParseMarkdownReferentielFolder.execute")
    def execute(self, trigger: events.MarkdownReferentielFolderUpdated):
        md_files = glob(os.path.join(trigger.folder_path, "*.md"))
        print(f"Parsing {len(md_files)} files to build referentiel node.")
        action_nodes = []
        for md_file in tqdm(md_files):
            actions_as_dict = self._build_actions_as_dict_from_md(md_file)
            for action_as_dict in actions_as_dict:
                try:
                    action_node = MarkdownActionNode(**action_as_dict)
                    action_nodes.append(action_node)
                except ValidationError as validation_error:
                    self.bus.publish_event(
                        events.ParseMarkdownReferentielFolderFailed(
                            str(validation_error)
                        )
                    )
                    return

        result = self._referentiel_from_actions(action_nodes)

        self.bus.publish_event(result)

    def _referentiel_from_actions(
            self,
            actions: List[MarkdownActionNode],
    ) -> events.DomainEvent:
        """
        Nest actions into a root referentiel action.
        This function is tightly coupled with the way markdowns are organized in each referentiels directories
        """
        root_actions = list(filter(self.is_root, actions))
        if len(root_actions) != 1:
            return events.ParseMarkdownReferentielFolderFailed(
                f"Le dossier de markdowns doit contenir une unique action racine (dont l'identifiant est ''). {len(root_actions)} trouvé(s)."
            )

        root_action = root_actions[0]

        regular_actions = list(filter(lambda action: not self.is_root(action), actions))

        sorted_actions = list(
            reversed(
                sorted(
                    regular_actions,
                    key=lambda action: len(action.identifiant.split(".")),
                )
            )
        )

        for orphan in sorted_actions:
            if self.level(orphan) == 1:  # Axes
                root_action.actions.append(orphan)
            else:
                closest_parents = list(
                    filter(
                        self.is_ancestor_of(orphan),
                        sorted_actions,
                    )
                )
                if len(closest_parents) == 0:
                    return events.ParseMarkdownReferentielFolderFailed(
                        f"L'action {orphan.identifiant} est orpheline ! "
                    )

                closest_parent = closest_parents[0]

                parent = self.find_parent_within_tree(orphan, closest_parent)

                if parent is None:
                    return events.ParseMarkdownReferentielFolderFailed(
                        f"Il manque un niveau entre l'action {closest_parent.identifiant} et son enfant {orphan.identifiant}"
                    )

                parent.actions.append(orphan)

        return events.MarkdownReferentielFolderParsed(referentiel_node=root_action)

    @staticmethod
    def _build_actions_as_dict_from_md(path: str) -> List[dict]:
        """Extract an action from a markdown document"""

        markdown = load_md(path)
        parser = build_markdown_parser(
            title_key="nom", description_key="description", initial_keyword="actions", keyword_node_builders={
                "actions": lambda: {"nom": "", "actions": []}}
        )
        actions_as_dict = parser(markdown)
        return actions_as_dict

    @staticmethod
    def is_ancestor_of(
            child: MarkdownActionNode,
    ) -> Callable[[MarkdownActionNode], bool]:
        return (
            lambda action: child.identifiant.startswith(action.identifiant)
                           and action.identifiant != child.identifiant
        )

    def is_parent_of(
            self, child: MarkdownActionNode
    ) -> Callable[[MarkdownActionNode], bool]:
        return (
            lambda action: self.is_ancestor_of(child)(action)
                           and self.level(child) == self.level(action) + 1
        )

    @staticmethod
    def is_root(action: MarkdownActionNode) -> bool:
        return action.identifiant == ""

    @staticmethod
    def get_leaves(action: MarkdownActionNode) -> List[MarkdownActionNode]:
        leaves: List[MarkdownActionNode] = []

        def _add_leaf(action: MarkdownActionNode):
            if not action.actions:
                leaves.append(action)
            else:
                list(map(_add_leaf, action.actions))
            return leaves

        return _add_leaf(action)

    @staticmethod
    def level(node: MarkdownActionNode) -> int:
        return len(node.identifiant.split("."))

    def find_parent_within_tree(
            self, child: MarkdownActionNode, tree: MarkdownActionNode
    ) -> Optional[MarkdownActionNode]:
        if not self.is_ancestor_of(child)(tree):
            return
        if self.is_parent_of(child)(tree):
            return tree

        ancestor_branch = list(filter(self.is_ancestor_of(child), tree.actions))
        if ancestor_branch:
            return self.find_parent_within_tree(child, ancestor_branch[0])
