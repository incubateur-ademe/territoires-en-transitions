from typing import List

from dataclasses import dataclass
from business.domain.models.action_definition import ReferentielActionId
from business.domain.models.litterals import ReferentielId

from business.utils.action_id import ActionId


@dataclass
class ActionChildren:
    referentiel_id: ReferentielId  # eg. "eci_2022"
    action_id: ActionId  # eg. "eci_1.1"
    children_ids: List[ActionId]  # ["eci_1.1.1", "eci_1.1.2"]
