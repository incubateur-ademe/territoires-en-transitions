from typing import List

from dataclasses import dataclass

from business.utils.action_id import ActionId


@dataclass
class ActionChildren:
    action_id: ActionId
    children_ids: List[ActionId]
