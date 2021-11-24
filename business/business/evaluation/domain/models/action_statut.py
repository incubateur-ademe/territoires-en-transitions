from dataclasses import dataclass

from business.core.domain.models.generated.business_action_statut_read import (
    ActionStatutAvancement as GeneratedActionStatutAvancement,
)
from business.utils.action_id import ActionId


ActionStatutAvancement = GeneratedActionStatutAvancement


@dataclass
class ActionStatut:
    action_id: ActionId
    avancement: "ActionStatutAvancement"
    concerne: "bool"

    @property
    def is_renseigne(self) -> bool:
        return self.avancement != ActionStatutAvancement.NON_RENSEIGNE

    @property
    def is_done(self) -> bool:
        return self.avancement == ActionStatutAvancement.FAIT

    @property
    def will_be_done(self) -> bool:
        return self.avancement in [
            ActionStatutAvancement.PROGRAMME,
            ActionStatutAvancement.EN_COURS,
        ]
