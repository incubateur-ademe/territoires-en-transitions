import logging

from business.evaluation.domain.models import events
from business.personnalisation.engine.regles_parser import ReglesParser
from business.personnalisation.execute_personnalisation_regles import (
    execute_personnalisation_regles,
)
from business.personnalisation.ports.personnalisation_repo import (
    AbstractPersonnalisationRepository,
)
from business.utils.domain_message_bus import AbstractDomainMessageBus
from business.utils.use_case import UseCase

logger = logging.getLogger()


class ComputeAndStoreReferentielPersonnalisationsForCollectivite(UseCase):
    def __init__(
        self,
        bus: AbstractDomainMessageBus,
        personnalisation_repo: AbstractPersonnalisationRepository,
        regles_parser: ReglesParser,
    ) -> None:
        self.bus = bus
        self.personnalisation_repo = personnalisation_repo
        self.regles_parser = regles_parser

    def execute(self, command: events.TriggerPersonnalisationForCollectivite):
        try:
            reponses = self.personnalisation_repo.get_reponses_for_collectivite(
                command.collectivite_id
            )
            identite = self.personnalisation_repo.get_identite_for_collectivite(
                command.collectivite_id
            )
            computed_action_personnalisations = execute_personnalisation_regles(
                self.regles_parser, reponses, identite
            )
            self.personnalisation_repo.save_action_personnalisation_consequences_for_collectivite(
                command.collectivite_id, computed_action_personnalisations
            )
            self.bus.publish_event(
                events.PersonnalisationForCollectiviteStored(
                    collectivite_id=command.collectivite_id
                )
            )
        except Exception as execution_error:

            self.bus.publish_event(
                events.PersonnalisationForCollectiviteFailed(
                    reason=f"Personnalisation for collectivite {command.collectivite_id} failed : "
                    + str(execution_error)
                )
            )
