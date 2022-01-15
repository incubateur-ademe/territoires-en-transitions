from typing import List

from business.utils.action_tree import ActionTree
from business.referentiel.domain.models.action_children import ActionChildren
from business.referentiel.domain.models.action_computed_point import (
    ActionComputedPoint,
)
from business.utils.points_almost_equal import points_almost_equal


def assert_children_points_sum_to_parent_point(
    children: List[ActionChildren], computed_points: List[ActionComputedPoint]
):
    computed_points_by_id = {
        computed_point.action_id: computed_point.value
        for computed_point in computed_points
    }
    action_tree = ActionTree(children)
    for action_id in action_tree.forward_ids:
        action_point = computed_points_by_id[action_id]
        action_children = action_tree.get_children(action_id)
        action_children_points = [
            computed_points_by_id[child_id] for child_id in action_children
        ]
        if action_children_points:
            assert (
                points_almost_equal(action_point, sum(action_children_points)) == True
            ), f"Children point don't sum up to parent point for action {action_id} with points {action_point} and children points {str(action_children_points)} (sum to {sum(action_children_points)})"
