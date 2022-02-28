from typing import List

from dataclasses import dataclass

from business.referentiel.domain.models.referentiel import ActionReferentiel
from business.utils.action_id import ActionId


@dataclass
class ActionChildren:
    referentiel: ActionReferentiel  # eg. "eci_2022"
    action_id: ActionId  # eg. "eci_1.1"
    children: List[ActionId]  # ["eci_1.1.1", "eci_1.1.2"]
