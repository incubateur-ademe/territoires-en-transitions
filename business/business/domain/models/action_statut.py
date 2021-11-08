from dataclasses import dataclass

from .generated.action_statut import (
    ActionStatut as GeneratedActionStatut,
    ActionStatutAvancement as GeneratedActionStatutAvancement,
)

ActionStatutAvancement = GeneratedActionStatutAvancement


@dataclass
class ActionStatut(GeneratedActionStatut):
    pass

    @property
    def is_renseigne(self) -> bool:
        return self.avancement != ActionStatutAvancement.NON_RENSEIGNEE

    @property
    def is_done(self) -> bool:
        return self.avancement == ActionStatutAvancement.FAITE

    @property
    def will_be_done(self) -> bool:
        return self.avancement in [
            ActionStatutAvancement.PROGRAMMEE,
            ActionStatutAvancement.EN_COURS,
        ]
