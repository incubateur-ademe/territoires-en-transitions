from __future__ import annotations
from typing import Callable, Dict, List

from pydantic import BaseModel

from business.domain.models.action_children import ActionChildren
from business.domain.models.action_points import ActionPoints
from business.domain.models.action_definition import ActionId

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
        self.root_node = self.build_root_node(actions_points, actions_children)
        self.forward_nodes = self._build_forward_nodes(self.root_node)
        self.backward_nodes = self.forward_nodes[::-1]
        self.taches = self.get_taches()

    @staticmethod
    def _find_root_action_point_id(actions_children: List[ActionChildren]) -> ActionId:
        action_children_ids = flatten_list(
            [action_children.children_ids for action_children in actions_children]
        )
        for action_children in actions_children:
            if action_children.action_id not in action_children_ids:
                return action_children.action_id
        raise ActionsPointsTreeError("No root action found. ")

    def build_root_node(
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

    def get_taches(self) -> List[ActionPointsNode]:
        taches = []
        for node in self.backward_nodes:
            if self.is_leaf(node):
                taches.append(node)
        return taches

    @staticmethod
    def is_leaf(action: ActionPointsNode):
        return action.children == []

    def map_on_taches(self, callback: Callable[[ActionPointsNode], None]):
        for tache in self.taches:
            callback(tache)

    def map_from_sous_actions_to_root(
        self, callback: Callable[[ActionPointsNode], None]
    ):
        for node in self.backward_nodes:
            if node not in self.taches:
                callback(node)

    @staticmethod
    def _build_forward_nodes(node: ActionPointsNode) -> List[ActionPointsNode]:
        forward_nodes: List[ActionPointsNode] = []

        def _append_node(node: ActionPointsNode):
            forward_nodes.append(node)
            if node.children:
                list(map(_append_node, node.children))

        _append_node(node)
        return forward_nodes
