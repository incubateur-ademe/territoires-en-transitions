from typing import List, Literal, Optional

from dataclasses import dataclass, field

from business.domain.models.action_definition import ActionId


@dataclass
class ActionPoints:
    action_id: ActionId
    value: float
