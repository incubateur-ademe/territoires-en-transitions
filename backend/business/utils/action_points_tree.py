from __future__ import annotations
from typing import Callable, Dict, List
from backend.domain.models.action_children import ActionChildren

from backend.domain.models.action_points import ActionPoints
from pydantic import BaseModel

from backend.domain.models.action_definition import ActionId

# TODO: can it inherit also from ActionPoints model ?
class ActionPointsNode(BaseModel):
    action_id: ActionId
    value: float
    children: List[ActionPointsNode]


ActionPointsNode.update_forward_refs()


class ActionsPointsTreeError(Exception):
    pass


def flatten_list(l: List) -> List:
    return [item for sublist in l for item in sublist]


class ActionsPointsTree:
    def __init__(
        self, actions_points: List[ActionPoints], actions_children: List[ActionChildren]
    ) -> None:
        self.root_node = self.get_root_node(actions_points, actions_children)
        self._depth = self._estimate_depth()
        self.parent_by_child_identifiant = self._get_parent_by_child_id()
        self.actions_per_level = self.get_action_points_per_level()

    @staticmethod
    def _find_root_action_point_id(actions_children: List[ActionChildren]) -> ActionId:
        action_children_ids = flatten_list(
            [action_children.children_ids for action_children in actions_children]
        )
        for action_children in actions_children:
            if action_children.action_id not in action_children_ids:
                return action_children.action_id
        raise ActionsPointsTreeError("No root action found. ")

    def get_root_node(
        self, actions_points: List[ActionPoints], actions_children: List[ActionChildren]
    ) -> ActionPointsNode:
        root_action_point_id = self._find_root_action_point_id(actions_children)
        action_points_by_id: Dict[ActionId, ActionPoints] = {
            action_points.action_id: action_points for action_points in actions_points
        }
        action_children_ids_by_id: Dict[ActionId, List[ActionId]] = {
            action_children.action_id: action_children.children_ids
            for action_children in actions_children
        }
        # Construct ActionPointsNode without children
        nodes_by_action_ids = {
            action_points.action_id: ActionPointsNode(
                action_id=action_points.action_id,
                value=action_points.value,
                children=[],
            )
            for action_points in action_points_by_id.values()
        }

        # Construct family relationship within ActionPointsNode
        for action_id in action_children_ids_by_id:
            nodes_by_action_ids[action_id].children = [
                nodes_by_action_ids[child_action_id]
                for child_action_id in action_children_ids_by_id[action_id]
            ]
        return nodes_by_action_ids[root_action_point_id]

    @property
    def depth(self) -> int:
        return self._depth

    def _estimate_depth(self) -> int:
        def _increment_depth_if_action_has_children(depth: int, node: ActionPointsNode):
            if node.children:
                return _increment_depth_if_action_has_children(
                    depth + 1, node.children[0]
                )
            return depth + 1

        return _increment_depth_if_action_has_children(0, self.root_node)

    def get_action_points_per_level(self) -> Dict[int, List[ActionPointsNode]]:
        taches = self._get_leaves()
        action_points_per_level = {self.depth: taches}
        for level in range(self.depth, 1, -1):
            action_points_per_level[level - 1] = self._get_unique_parents_from(
                action_points_per_level[level]
            )
        action_points_per_level[0] = [self.root_node]
        return action_points_per_level

    def _get_leaves(self) -> List[ActionPointsNode]:
        leaves = []

        def _add_node_if_leave(action: ActionPointsNode):
            if self.is_leaf(action):
                leaves.append(action)
            list(map(_add_node_if_leave, action.children))

        _add_node_if_leave(self.root_node)
        return leaves

    def _get_parent_by_child_id(self) -> Dict[str, ActionPointsNode]:
        parent_by_child_identifiant = {}

        def _add_parent(action: ActionPointsNode):
            if not action.children:
                return
            for child in action.children:
                parent_by_child_identifiant[child.action_id] = action
            list(map(_add_parent, action.children))

        _add_parent(self.root_node)
        return parent_by_child_identifiant

    def _get_unique_parents_from(
        self,
        actions: List[ActionPointsNode],
    ) -> List[ActionPointsNode]:
        unique_parents_from = []
        unique_parents_from_ids = []
        for action in actions:
            parent = self.parent_by_child_identifiant[action.action_id]
            if parent.action_id not in unique_parents_from_ids:
                unique_parents_from.append(parent)
                unique_parents_from_ids.append(parent.action_id)
        return unique_parents_from

    @staticmethod
    def is_leaf(action: ActionPointsNode):
        return action.children == []

    def map_on_taches(self, callback: Callable[[ActionPointsNode], None]):
        for tache in self.actions_per_level[self.depth]:
            callback(tache)

    def map_from_sous_actions_to_root(
        self, callback: Callable[[ActionPointsNode], None]
    ):
        for level in range(self.depth - 1, 0, -1):
            level_actions = self.actions_per_level[level]
            for level_action in level_actions:
                callback(level_action)
