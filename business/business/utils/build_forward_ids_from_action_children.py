from typing import Dict, List

from business.referentiel.domain.models.action_children import ActionId

# TODO : move this file to domain Referentiel


def flatten(L: List[List]):
    return [item for sublist in L for item in sublist]


def build_forward_ids_from_children_ids_by_action_id(
    children_ids_by_action_id: Dict[ActionId, List[ActionId]],
) -> List[ActionId]:

    action_ids = list(
        set(
            flatten(list(children_ids_by_action_id.values()))
            + list(children_ids_by_action_id.keys())
        )
    )

    def get_action_depth(action_id: ActionId):
        children_ids = children_ids_by_action_id.get(action_id)
        if not children_ids:
            return 0
        return 1 + max([get_action_depth(child_id) for child_id in children_ids])

    return sorted(
        action_ids,
        key=lambda action_id: get_action_depth(action_id),
        reverse=True,
    )
