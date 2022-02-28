from dataclasses import dataclass
from enum import Enum

from typing import Any

from business.utils.action_id import ActionId


class ActionStatutAvancement(Enum):
    EN_COURS = "en_cours"
    FAIT = "fait"
    NON_RENSEIGNE = "non_renseigne"
    PAS_FAIT = "pas_fait"
    PROGRAMME = "programme"

    @classmethod
    def from_json_data(cls, data: Any) -> "ActionStatutAvancement":
        return cls(data)


@dataclass
class ActionStatut:
    action_id: ActionId
    avancement: "ActionStatutAvancement"
    concerne: "bool"

    @property
    def is_renseigne(self) -> bool:
        return self.avancement != ActionStatutAvancement.NON_RENSEIGNE

    @property
    def is_fait(self) -> bool:
        return self.avancement == ActionStatutAvancement.FAIT

    @property
    def is_programme(self) -> bool:
        return self.avancement == ActionStatutAvancement.PROGRAMME

    @property
    def is_pas_fait(self) -> bool:
        return self.avancement == ActionStatutAvancement.PAS_FAIT
