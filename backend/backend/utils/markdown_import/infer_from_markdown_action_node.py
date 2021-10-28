from __future__ import annotations
from typing import List

from backend.domain.models.action_children import ActionChildren
from backend.domain.models.action_definition import ActionDefinition
from backend.utils.markdown_import.markdown_action_node import MarkdownActionNode


def infer_action_definition_entities_from_markdown_action_node(
    markdown_action_node: MarkdownActionNode,
) -> List[ActionDefinition]:
    """Convert a MarkdownActionNode to a list of ActionDefinition"""
    action_definition_entities: List[ActionDefinition] = []

    def _increment_list(
        markdown_action_node: MarkdownActionNode,
    ) -> List[ActionDefinition]:
        action_definition_entity = ActionDefinition(
            referentiel_id=markdown_action_node.referentiel_id,
            thematique_id=markdown_action_node.thematique_id,
            action_id=markdown_action_node.action_id,
            identifiant=markdown_action_node.identifiant,
            nom=markdown_action_node.nom,
            contexte=markdown_action_node.contexte,
            description=markdown_action_node.description,
            exemples=markdown_action_node.exemples,
            ressources=markdown_action_node.ressources,
            points=markdown_action_node.points,
            percentage=markdown_action_node.percentage,
        )
        action_definition_entities.append(action_definition_entity)
        children_nodes = markdown_action_node.actions
        if children_nodes:
            list(map(_increment_list, children_nodes))
        return action_definition_entities

    return _increment_list(markdown_action_node)


def infer_action_children_entities_from_markdown_action_node(
    markdown_action_node: MarkdownActionNode,
) -> List[ActionChildren]:
    """Convert a MarkdownActionNode to a list of ActionDefinition"""
    action_children_entities: List[ActionChildren] = []

    def _increment_list(
        markdown_action_node: MarkdownActionNode,
    ) -> List[ActionChildren]:
        action_children_entity = ActionChildren(
            action_id=markdown_action_node.action_id,
            children_ids=[child.action_id for child in markdown_action_node.actions],
        )
        action_children_entities.append(action_children_entity)
        children_nodes = markdown_action_node.actions
        if children_nodes:
            list(map(_increment_list, children_nodes))
        return action_children_entities

    return _increment_list(markdown_action_node)


# def markdown_action_node_to_markdown_actions(
#     markdown_action_node: MarkdownActionNode,
# ) -> List[ActionDetail]:
#     """Convert a MarkdownActionNode to a list of MarkdownAction"""
#     markdown_actions: List[ActionDetail] = []

#     def _increment_list(
#         markdown_action_node: MarkdownActionNode,
#     ) -> List[ActionDetail]:
#         markdown_actions.append(markdown_action_node.to_entity())
#         children_nodes = markdown_action_node.children
#         if children_nodes:
#             list(map(_increment_list, children_nodes))
#         return markdown_actions

#     return _increment_list(markdown_action_node)

# def markdown_actions_to_markdown_action_node(
#     raw_actions: List[ActionDetail], root_action_id: ActionId
# ) -> MarkdownActionNode:
#     """Convert a list of MarkdownAction to a MarkdownActionNode"""
#     raw_action_nodes_by_id = {
#         raw_action_node.id: raw_action_node for raw_action_node in raw_actions
#     }

#     def _markdown_action_node_to_markdown_action_node(raw_action_node: ActionDetail):
#         return MarkdownActionNode(
#             referentiel_id=raw_action_node.referentiel_id,
#             identifiant=raw_action_node.identifiant,
#             nom=raw_action_node.nom,
#             thematique_id=raw_action_node.thematique_id,
#             description=raw_action_node.description,
#             contexte=raw_action_node.contexte,
#             exemples=raw_action_node.exemples,
#             ressources=raw_action_node.ressources,
#             points=raw_action_node.points,
#             percentage=raw_action_node.percentage,
#             actions_ids=raw_action_node.actions_ids,
#             children=[
#                 _markdown_action_node_to_markdown_action_node(
#                     raw_action_nodes_by_id[child_id]
#                 )
#                 for child_id in raw_action_node.actions_ids
#             ],
#         )

#     return _markdown_action_node_to_markdown_action_node(
#         raw_action_nodes_by_id[root_action_id]
#     )


# class MarkdownReferentiel(AbstractReferentiel):
#     def __init__(
#         self,
#         markdown_folder: str,
#         name: str,
#         referentiel_id: ReferentielId,
#         points: float,
#     ):
#         self.referentiel_id = referentiel_id
#         self.points = points
#         self._root_action = self._build_referentiel_from_md_folder(
#             markdown_folder, name
#         )
#         # self.fill_points()
#         super().__init__()

# def fill_points(self):
#     self._fill_parent_points_from_children()
#     self._fill_children_points_from_parents(self.root_action)

# def _fill_parent_points_from_children(self):
#     """If an action has no points, but its children have, then set action points to the sum of its children's points"""
#     # TODO : this could be a method that instead of mutating the referentiel, computes a Dict[ActionId, points]
#     action_to_fill = (
#         self._search_next_parent_action_without_points_and_chidren_with(
#             self.root_action
#         )
#     )
#     if action_to_fill:
#         self._set_action_points_to_sum_of_children_points(action_to_fill)
#         self._fill_parent_points_from_children()

# def _fill_children_points_from_parents(self, action: MarkdownActionReferentiel):
#     """If action children are given in percentage, then distribute the action points according to the percentage"""
#     action_children = action.actions
#     action_points = action.points
#     if not action_children or not action_points:
#         return
#     children_have_points = action_children[0].points is not None
#     if children_have_points:
#         return

#     if action_children[0].points is None:
#         for action_child in action_children:
#             percentage = action_child.percentage or action_points / len(
#                 action_children
#             )  # if percentage is not specified, then points are equi-distributed within siblings
#             action_child.points = (percentage / 100) * action_points
#     map(self._fill_children_points_from_parents, action_children)

# def get_root_action(self) -> MarkdownActionReferentiel:
#     return self._root_action

# def _build_referentiel_from_md_folder(self, path: str, name: str):
#     md_files = glob(os.path.join(path, "*.md"))
#     actions = [self._build_action_from_md(md_file) for md_file in md_files]
#     return self._referentiel_from_actions(actions, name)

# def _referentiel_from_actions(
#     self, actions: List[MarkdownActionReferentiel], name: str
# ) -> MarkdownActionReferentiel:
#     """
#     Nest actions into a root referentiel action.

#     This function is tightly coupled with the way markdowns are organized in each referentiels directories
#     """

#     def attach_children(parent: MarkdownActionReferentiel) -> None:
#         for action in actions:
#             if (
#                 action.identifiant.startswith(parent.identifiant)
#                 and action.identifiant != parent.identifiant
#             ):
#                 parent.actions.append(action)

#     level_1_actions = []
#     for action in actions:
#         if "." not in action.identifiant:
#             level_1 = action
#             if level_1.actions:
#                 for level_2 in level_1.actions:
#                     attach_children(level_2)

#             else:
#                 attach_children(level_1)

#             level_1_actions.append(level_1)
#     return MarkdownActionReferentiel(
#         referentiel_id=self.referentiel_id,
#         nom=name,
#         identifiant="",
#         actions=level_1_actions,
#         points=self.points,
#     )

# def _build_action_from_md(self, path: str) -> MarkdownActionReferentiel:
#     """Extract an action from a markdown document"""

#     markdown = load_md(path)

#     def builder():
#         return {
#             "nom": "",
#             "actions": [],
#             "referentiel_id": self.referentiel_id,
#         }  # TODO : rewrite this markdown_parser in a more generic way.

#     action_as_dict = markdown_parser(
#         markdown, node_builder=builder, children_key="actions"
#     )[-1]
#     return MarkdownActionReferentiel(**action_as_dict)
