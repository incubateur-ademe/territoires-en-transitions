from typing import Literal

from dataclasses import dataclass

from business.domain.models.action_definition import ActionId


Avancement = Literal["faite", "pas_faite", "programmee", "en_cours", "non_renseignee"]


pas_faite: Avancement = "pas_faite"
programmee: Avancement = "programmee"
en_cours: Avancement = "en_cours"
faite: Avancement = "faite"
non_renseignee: Avancement = "non_renseignee"


@dataclass
class ActionStatus:  # TODO: rename Statut
    action_id: ActionId
    avancement: Avancement
    concernee: bool

    @property
    def is_renseigne(self) -> bool:
        return self.avancement != non_renseignee

    @property
    def is_done(self) -> bool:
        return self.avancement == faite

    @property
    def will_be_done(self) -> bool:
        return self.avancement in [programmee, en_cours]
