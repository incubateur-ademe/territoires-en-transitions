from __future__ import annotations
from typing import Callable, Dict, List

from pydantic import BaseModel
from tqdm import tqdm

from business.referentiel.domain.models.action_children import ActionChildren
from business.referentiel.domain.models.action_points import ActionPoints
from business.referentiel.domain.models.action_definition import ActionId
from business.utils.timeit import timeit

# TODO: can it inherit also from ActionPoints model ?
class RecursivePointNode(BaseModel):
    action_id: ActionId
    value: float
    children: List[RecursivePointNode]


RecursivePointNode.update_forward_refs()


class ActionsPointsTreeError(Exception):
    pass


def flatten_list(l: List) -> List:
    return [item for sublist in l for item in sublist]


class ActionPointTree:
    def __init__(
        self, actions_points: List[ActionPoints], actions_children: List[ActionChildren]
    ) -> None:
        self.root_node = self.build_root_node(actions_points, actions_children)
        self._forward_action_ids = self._build_forward_action_ids(self.root_node)
        self._backward_action_ids = self._forward_action_ids[::-1]

        self._points_by_id = {
            action_point.action_id: action_point.value
            for action_point in actions_points
        }
        self._children_by_id = {
            action_children.action_id: action_children.children_ids
            for action_children in actions_children
        }
        self._tache_ids = self.get_tache_ids()

    @staticmethod
    def _find_root_action_point_id(actions_children: List[ActionChildren]) -> ActionId:
        action_children_ids = flatten_list(
            [action_children.children_ids for action_children in actions_children]
        )
        for action_children in actions_children:
            if action_children.action_id not in action_children_ids:
                return action_children.action_id
        raise ActionsPointsTreeError("No root action found. ")

    @staticmethod
    def get_action_level(action_id: ActionId):
        if len(action_id.split("_")) == 1:
            return 0
        return len(action_id.split("."))  # TODO : find better way to infer level

    def get_action_point(self, action_id: ActionId) -> float:
        return self._points_by_id[action_id]

    def get_action_children(self, action_id: ActionId) -> List[ActionId]:
        return self._children_by_id.get(action_id, [])

    def get_action_siblings(self, action_id: ActionId) -> List[ActionId]:
        action_parent = [
            parent_id
            for parent_id, children in self._children_by_id.items()
            if action_id in children
        ]
        return self.get_action_children(action_parent[0]) if action_parent else []

    def build_root_node(
        self, actions_points: List[ActionPoints], actions_children: List[ActionChildren]
    ) -> RecursivePointNode:
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
            action_points.action_id: RecursivePointNode(
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

    def get_tache_ids(self) -> List[ActionId]:
        tache_ids = []
        for action_id in self._backward_action_ids:
            if self.is_leaf(action_id):
                tache_ids.append(action_id)
        return tache_ids

    def is_leaf(self, action_id: ActionId):
        return self.get_action_children(action_id) == []

    @timeit("map on taches")
    def map_on_taches(self, callback: Callable[[ActionId], None]):
        for tache_id in tqdm(self._tache_ids):
            callback(tache_id)

    @timeit("map from sous actions to root")
    def map_from_sous_actions_to_root(self, callback: Callable[[ActionId], None]):
        for action_id in tqdm(self._backward_action_ids):
            if action_id not in self._tache_ids:
                callback(action_id)

    @timeit("map from taches to root")
    def map_from_taches_to_root(self, callback: Callable[[ActionId], None]):
        for action_id in tqdm(self._backward_action_ids):
            callback(action_id)

    @timeit("map from actions to taches")
    def map_from_action_to_taches(
        self, callback: Callable[[ActionId], None], action_level: int
    ):
        for action_id in tqdm(self._forward_action_ids):
            this_level = this_level = self.get_action_level(action_id)
            if this_level >= action_level:
                callback(action_id)

    @staticmethod
    def _build_forward_action_ids(node: RecursivePointNode) -> List[ActionId]:
        forward_action_ids: List[ActionId] = []

        def _append_node(node: RecursivePointNode):
            forward_action_ids.append(node.action_id)
            if node.children:
                list(map(_append_node, node.children))

        _append_node(node)
        return forward_action_ids

    @staticmethod
    def _build_nodes_by_id(
        node: RecursivePointNode,
    ) -> Dict[ActionId, RecursivePointNode]:
        nodes_by_id: Dict[ActionId, RecursivePointNode] = {}

        def _append_node(node: RecursivePointNode):
            nodes_by_id[node.action_id] = node
            if node.children:
                list(map(_append_node, node.children))

        _append_node(node)
        return nodes_by_id
