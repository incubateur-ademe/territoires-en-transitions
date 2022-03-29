from business.personnalisation.ports.personnalisation_repo import (
    AbstractPersonnalisationRepository,
)
from business.utils.use_case import UseCase
from business.utils.domain_message_bus import AbstractDomainMessageBus


class CatchUpUnprocessedReponseUpdateEvents(UseCase):
    def __init__(
        self,
        bus: AbstractDomainMessageBus,
        personnalisation_repo: AbstractPersonnalisationRepository,
    ) -> None:
        self.bus = bus
        self.personnalisation_repo = personnalisation_repo

    def execute(self):
        for event in self.personnalisation_repo.get_unprocessed_reponse_events():
            self.bus.publish_event(event)
