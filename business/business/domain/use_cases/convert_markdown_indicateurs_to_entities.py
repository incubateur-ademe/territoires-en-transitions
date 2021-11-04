from typing import Dict, List

from business.domain.models import events
from business.domain.models import commands
from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
)
from .use_case import UseCase


class MarkdownIndicateurInconsistent(Exception):
    pass


class ConvertMarkdownIndicateursToEntities(UseCase):
    points_round_digits = 2

    def __init__(self, bus: AbstractDomainMessageBus) -> None:
        self.bus = bus

    def execute(self, command: commands.ConvertMarkdownIndicateursToEntities):
        pass
        # parse
        # convert
        # publish
        # self.bus.publish_event(
        #     events.MarkdownIndicateurConvertedToEntities(
        #         points=points_entities,
        #         definitions=definition_entities,
        #         children=children_entities,
        #         referentiel_id=self.referentiel_id,
        #     )
        # )
