from dataclasses import asdict
from typing import Dict, List, Type

from business.domain.models import events
from business.domain.models import commands
from business.domain.models.commands import DomainCommand

from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
    EventCallback,
)
from business.domain.use_cases import *
from .config import Config


class PrepareBusError(Exception):
    pass


def make_on_event_publish_command(
    bus: AbstractDomainMessageBus, command_type: Type[DomainCommand]
) -> EventCallback:
    def on_event_publish_command(event: events.DomainEvent):
        command = command_type.from_dict(asdict(event))
        # command = command_from_dict(command_type, asdict(event))
        bus.publish_command(command)

    return on_event_publish_command


CommandHandlers = Dict[Type[commands.DomainCommand], Type[UseCase]]
EventHandlers = Dict[Type[events.DomainEvent], List[Type[commands.DomainCommand]]]

# TODO : simplify handlers by removing "command" level
def prepare_bus(
    config: Config, event_handlers: EventHandlers, command_handlers: CommandHandlers
):

    bus = config.domain_message_bus
    use_cases = config.prepare_use_cases()

    # EVENTS
    for event_type, commands in event_handlers.items():
        for command in commands:
            bus.subscribe_to_event(
                event_type, make_on_event_publish_command(command_type=command, bus=bus)
            )
    # COMMANDS
    for command_type, command_use_case in command_handlers.items():
        try:
            use_case = [
                use_case for use_case in use_cases if command_use_case == type(use_case)
            ][0]
        except IndexError:
            raise PrepareBusError(
                f"No use case of type {command_use_case} declared. cannot add command handler for {command_type}"
            )
        bus.subscribe_to_command(command_type, use_case.execute)
