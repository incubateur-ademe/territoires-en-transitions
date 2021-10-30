from dataclasses import dataclass

from business.domain.models.action_definition import ActionId


@dataclass
class ActionPoints:
    action_id: ActionId
    value: float
