from typing import Dict, List, Type

from business.utils.use_case import UseCase, DomainEvent
from .config import Config


class PrepareBusError(Exception):
    pass


EventHandlers = Dict[Type[DomainEvent], List[Type[UseCase]]]


def prepare_bus(
    config: Config,
    event_handlers: EventHandlers,
):
    use_cases = config.prepare_use_cases()
    bus = config.domain_message_bus
    for event_type, list_type_use_cases in event_handlers.items():
        for type_use_case in list_type_use_cases:
            try:
                use_case = [
                    use_case
                    for use_case in use_cases
                    if type_use_case == type(use_case)
                ][0]
            except IndexError:
                raise PrepareBusError(
                    f"No use case of type {use_case} declared. cannot add event handler for {event_type}"
                )
            bus.subscribe_to_event(event_type, use_case.execute)
