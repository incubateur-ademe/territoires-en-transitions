from dataclasses import dataclass
from typing import List, Literal, NewType, Optional

from business.utils.action_id import ActionId


# TODO : This should be generated !

IndicateurGroup = Literal["eci", "cae", "crte"]

IndicateurId = NewType("IndicateurId", str)


@dataclass
class Indicateur:
    indicateur_id: IndicateurId
    identifiant: str
    indicateur_group: IndicateurGroup
    nom: str
    unite: str
    action_ids: List[ActionId]
    description: str
    values_refers_to: Optional[IndicateurId] = None
    obligation_eci: Optional[bool] = False
