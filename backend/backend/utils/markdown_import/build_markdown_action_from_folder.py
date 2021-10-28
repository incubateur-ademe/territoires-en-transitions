from __future__ import annotations
from glob import glob
import os
from typing import List

from backend.domain.models.litterals import ReferentielId
from backend.utils.markdown_import.markdown_parser import markdown_parser
from backend.utils.markdown_import.markdown_utils import load_md
from backend.utils.markdown_import.markdown_action_node import MarkdownActionNode


def _referentiel_from_actions(
    actions: List[MarkdownActionNode],
    root_action_name: str,
    referentiel_id: ReferentielId,
    root_action_points: float,
) -> MarkdownActionNode:
    """
    Nest actions into a root referentiel action.

    This function is tightly coupled with the way markdowns are organized in each referentiels directories
    """

    def attach_children(parent: MarkdownActionNode) -> None:
        for action in actions:
            if (
                action.identifiant.startswith(parent.identifiant)
                and action.identifiant != parent.identifiant
            ):
                parent.actions.append(action)

    level_1_actions = []
    for action in actions:
        if "." not in action.identifiant:
            level_1 = action
            if level_1.actions:
                for level_2 in level_1.actions:
                    attach_children(level_2)

            else:
                attach_children(level_1)

            level_1_actions.append(level_1)

    return MarkdownActionNode(
        referentiel_id=referentiel_id,
        nom=root_action_name,
        identifiant="",
        children=level_1_actions,
        points=root_action_points,
    )


def _build_action_from_md(path: str, referentiel_id: str) -> MarkdownActionNode:
    """Extract an action from a markdown document"""

    markdown = load_md(path)

    def builder():
        return {
            "nom": "",
            "actions": [],
            "referentiel_id": referentiel_id,
        }  # TODO : rewrite this markdown_parser in a more generic way.

    action_as_dict = markdown_parser(
        markdown, node_builder=builder, children_key="actions"
    )[-1]

    return MarkdownActionNode(**action_as_dict)


def build_markdown_action_from_folder(
    path: str,
    root_action_name: str,
    referentiel_id: ReferentielId,
    root_action_points: float,
) -> MarkdownActionNode:
    md_files = glob(os.path.join(path, "*.md"))
    actions = [_build_action_from_md(md_file, referentiel_id) for md_file in md_files]
    return _referentiel_from_actions(
        actions, root_action_name, referentiel_id, root_action_points
    )
