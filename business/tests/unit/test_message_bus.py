import dataclasses
from typing import Any, Dict, Type

from dataclasses import asdict, dataclass
from business.entrypoints.prepare_bus import prepare_bus
from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
    InMemoryDomainMessageBus,
)
from business.domain.ports.referentiel_repo import AbstractReferentielRepository
from business.domain.ports.action_score_repo import AbstractActionScoreRepository
from business.domain.ports.action_status_repo import AbstractActionStatusRepository
from business.domain.ports.data_layer_event_bus import AbstractDataLayerEventBus
from business.domain.use_cases import *
from business.domain.models import commands, events

# from business.service_layer.handlers import COMMAND_HANDLERS, EVENT_HANDLERS
from tests.utils.spy_on_event import spy_on_event


@dataclass
class NewMessage(events.DomainEvent):
    message: str


@dataclass
class MessageSent(events.DomainEvent):
    message: str


@dataclass
class SendMessage(commands.DomainCommand):
    message: str


class SendMessageUseCase(UseCase):
    def __init__(self, bus: AbstractDomainMessageBus) -> None:
        self.bus = bus

    def execute(self, command: SendMessage) -> Any:
        print(command.message)
        self.bus.publish_event(MessageSent(command.message))


COMMAND_HANDLERS = {SendMessage: SendMessageUseCase}

EVENT_HANDLERS = {
    NewMessage: [SendMessage],
}


def test_message_bus():
    bus = InMemoryDomainMessageBus()
    use_cases = {SendMessageUseCase: SendMessageUseCase(bus)}
    # EVENTS
    for event_type, commands in EVENT_HANDLERS.items():
        for command in commands:
            bus.subscribe_to_event(
                event_type, lambda event: bus.publish_command(command(**asdict(event)))
            )
    # COMMANDS
    for command_type, use_case_class in COMMAND_HANDLERS.items():
        use_case: UseCase = use_cases[use_case_class]
        bus.subscribe_to_command(command_type, use_case.execute)

    message_sent_events = spy_on_event(bus, MessageSent)

    bus.publish_event(NewMessage("lala"))
    assert len(message_sent_events) == 1
    assert message_sent_events[0].message == "lala"


