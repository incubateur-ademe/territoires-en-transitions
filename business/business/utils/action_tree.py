from __future__ import annotations
import re
from typing import Callable, List, Optional
from .models.actions import ActionChildren, ActionId

parent_pattern = re.compile(r'(.*)[._]')


class ActionTreeError(Exception):
    pass


class ActionTree:
    """Un arbre d'action avec des méthodes d'itération"""

    def __init__(self, actions_children: list[ActionChildren]) -> None:
        self.depths: dict[ActionId, int] = {}
        self.children: dict[ActionId, list[ActionId]] = {}
        self.leafs: set[ActionId] = set()

        for action in actions_children:
            self.children[action.action_id] = action.children
            self.depths[action.action_id] = action.action_id.count('_') + action.action_id.count('.')
            if not action.children:
                self.leafs.add(action.action_id)

        self._forward_ids: list[ActionId] = sorted(
            self.depths.keys(),
            key=lambda action_id: self.depths[action_id],
        )
        self._backward_ids: list[ActionId] = self._forward_ids[::-1]
        self.leaf_count: dict[ActionId, int] = {
            x: max(len({l for l in self.leafs if self._get_parent(l) == x}), 1)
            for x in self._forward_ids
        }

    def get_children(self, action_id: ActionId) -> List[ActionId]:
        return self.children.get(action_id, [])

    def get_siblings(self, action_id: ActionId) -> List[ActionId]:
        parent = self._get_parent(action_id)
        return self.get_children(parent) if parent else []

    def map_from_taches_to_root(self, callback: Callable[[ActionId], None]):
        for action_id in self._backward_ids:
            callback(action_id)

    def map_from_actions_to_taches(
            self, callback: Callable[[ActionId], None], action_depth: int
    ):
        for action_id in self._forward_ids:
            this_depth = self.depths[action_id]
            if this_depth >= action_depth:
                callback(action_id)

    def map_from_action_to_taches(
            self,
            callback: Callable[[ActionId], None],
            action_id: ActionId,
    ):
        """Appelle la fonction callback en partant de [action_id] jusqu'aux tâches."""
        callback(action_id)
        for action_child in self.get_children(action_id):
            self.map_from_action_to_taches(callback, action_child)

    def map_from_action_to_root(
            self,
            callback: Callable[[ActionId], None],
            action_id: ActionId
    ):
        callback(action_id)
        action_parent = self._get_parent(action_id)
        if action_parent:
            self.map_from_action_to_root(callback, action_parent)

    @staticmethod
    def _get_parent(action_id: ActionId) -> Optional[ActionId]:
        match = parent_pattern.match(action_id, 0)
        return match.group(1) if match else None

    @property
    def forward_ids(self):
        return self._forward_ids

    @property
    def backward_ids(self):
        return self._backward_ids

    def is_leaf(self, action_id: ActionId):
        return action_id in self.leafs
