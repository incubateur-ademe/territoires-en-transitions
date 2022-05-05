from typing import List, Optional

from dataclasses import dataclass

from business.referentiel.domain.models.referentiel import ActionReferentiel
from business.utils.action_id import ActionId


@dataclass
class ActionRelation:
    referentiel: ActionReferentiel  # eg. "eci"
    id: ActionId  # eg. "eci_1.1"
    parent: Optional[ActionId]  # eg. "eci_1"
