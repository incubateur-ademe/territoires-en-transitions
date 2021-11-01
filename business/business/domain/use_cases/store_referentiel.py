from typing import Optional

from business.domain.models import commands, events
from business.domain.ports.domain_message_bus import AbstractDomainMessageBus
from business.domain.ports.referentiel_repo import AbstractReferentielRepository

from .use_case import UseCase


class StoreReferentiel(UseCase):
    def __init__(
        self,
        bus: AbstractDomainMessageBus,
        referentiel_repo: AbstractReferentielRepository,
    ) -> None:
        self.bus = bus
        self.referentiel_repo = referentiel_repo

    def execute(self, command: commands.StoreReferentielEntities):
        self.definition_entities = command.definitions
        self.children_entities = command.children
        self.points_entities = command.points

        # TODO : Should we perform here a quick command sanity check, or is it of repo responsability ?
        # It would be something like:
        failure_event = self.fail_if_entities_are_inconsistent()
        if failure_event:
            self.bus.publish_event(failure_event)
            return

        # TODO : this should be transactionnal !
        # Question : Should it be only one port AbstractReferentielRepo, with a method that takes those three arguments ?
        try:
            self.referentiel_repo.add_referentiel(
                self.definition_entities, self.children_entities, self.points_entities
            )

            self.bus.publish_event(
                events.ReferentielStored(referentiel_id=command.referentiel_id)
            )
        except Exception as storing_error:  # TODO : Should be a more precise error
            self.bus.publish_event(events.ReferentielStorageFailed(str(storing_error)))

    def fail_if_entities_are_inconsistent(self) -> Optional[events.DomainFailureEvent]:
        # check same number of entities
        if not (
            len(self.definition_entities)
            == len(self.children_entities)
            == len(self.points_entities)
        ):
            return events.ReferentielStorageFailed(
                f"Entity count are different between definitions ({len(self.definition_entities)}), points ({len(self.points_entities)}) and children ({len(self.children_entities)})!"
            )

        # check same action ids
        def_action_ids = [entity.action_id for entity in self.definition_entities]
        children_action_ids = [entity.action_id for entity in self.children_entities]
        points_action_ids = [entity.action_id for entity in self.points_entities]

        if not (
            set(def_action_ids) == set(children_action_ids) == set(points_action_ids)
        ):
            return events.ReferentielStorageFailed(
                f"Not same action ids between definitions ({def_action_ids}), points ({points_action_ids}) and children ({children_action_ids})!"
            )

        # check action ids in children are coherent
        for children_entity in self.children_entities:
            if not all(
                [
                    child_id in children_action_ids
                    for child_id in children_entity.children_ids
                ]
            ):
                return events.ReferentielStorageFailed(
                    f"Inconsistency in action {children_entity.action_id}: some children id are refered but defined."
                )
