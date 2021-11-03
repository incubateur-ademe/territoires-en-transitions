from dataclasses import dataclass
from typing import Literal

Avancement = Literal["faite", "pas_faite", "programmee", "en_cours", "non_renseignee"]


@dataclass
class ActionStatut:
    epci_id: int
    action_id: str
    avancement: Avancement
    concernee: bool
