from copy import deepcopy, copy
import logging
from typing import List


from business.utils.models.actions import ActionChildren, ActionComputedPoint
from business.utils.action_tree import ActionTree, ActionId

logger = logging.getLogger()


class ActionPointTree(ActionTree):
    def __init__(
        self,
        actions_points: List[ActionComputedPoint],
        actions_children: List[ActionChildren],
    ) -> None:
        super().__init__(actions_children)

        self._points_by_id = {
            action_point.action_id: action_point.value
            for action_point in actions_points
        }

    def clone(self):
        clone = copy(self)
        clone._points_by_id = deepcopy(self._points_by_id)
        return clone

    def get_action_point(self, action_id: ActionId) -> float:
        return self._points_by_id[action_id]

    def set_action_point(self, action_id: ActionId, value: float) -> None:
        self._points_by_id[action_id] = value
