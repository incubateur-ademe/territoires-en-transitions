from __future__ import annotations

import os
from glob import glob
from typing import List, Callable

from backend.utils.markdown_import.markdown_action_node import MarkdownActionNode
from backend.utils.markdown_import.markdown_parser import build_markdown_parser
from backend.utils.markdown_import.markdown_utils import load_md


class MarkdownImportError(Exception):
    pass


def is_parent_of(child: MarkdownActionNode) -> Callable[[MarkdownActionNode], bool]:
    return (
        lambda action: child.identifiant.startswith(action.identifiant)
        and action.identifiant != child.identifiant
    )


def is_root(action: MarkdownActionNode) -> bool:
    return action.identifiant == ""


def _referentiel_from_actions(
    actions: List[MarkdownActionNode],
) -> MarkdownActionNode:
    """
    Nest actions into a root referentiel action.

    This function is tightly coupled with the way markdowns are organized in each referentiels directories
    """
    root_action = list(filter(is_root, actions))[0]  # TODO raise if no root
    regular_actions = list(filter(lambda action: not is_root(action), actions))

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
                    is_parent_of(orphan),
                    sorted_actions,
                )
            )
            if len(parents) == 0:
                raise MarkdownImportError(
                    f"L'action {orphan.identifiant} est orpheline ! "
                )
            # TODO : Test that orphan depth is indeed parent depth + 1. Else raise.

            parents[0].actions.append(orphan)

    return root_action


def _build_actions_from_md(path: str) -> List[MarkdownActionNode]:
    """Extract an action from a markdown document"""

    markdown = load_md(path)
    parser = build_markdown_parser(
        title_key="nom", children_key="actions", description_key="description"
    )
    actions_as_dict = parser(markdown)

    return [MarkdownActionNode(**action_as_dict) for action_as_dict in actions_as_dict]


def build_markdown_action_from_folder(
    path: str,
) -> MarkdownActionNode:
    md_files = glob(os.path.join(path, "*.md"))

    actions = []
    for md_file in md_files:
        md_file_actions = _build_actions_from_md(md_file)
        actions += md_file_actions

    return _referentiel_from_actions(actions)
