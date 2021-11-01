import abc
from collections import defaultdict
from dataclasses import asdict
from typing import Any, Callable, Dict, List, Optional, Type

from business.domain.models import commands, events

EventCallback = Callable[[events.DomainEvent], Any]
CommandCallback = Callable[[commands.DomainCommand], Any]


class AbstractDomainMessageBus(abc.ABC):
    @abc.abstractclassmethod
    def subscribe_to_event(
        self,
        event_type: Type[events.DomainEvent],
        callback: EventCallback,
    ) -> None:
        raise NotImplementedError()

    @abc.abstractclassmethod
    def subscribe_to_command(
        self,
        command_type: Type[commands.DomainCommand],
        callback: CommandCallback,
    ) -> None:
        raise NotImplementedError()

    @abc.abstractmethod
    def publish_event(self, event: events.DomainEvent) -> None:
        raise NotImplementedError()

    @abc.abstractmethod
    def publish_command(self, command: commands.DomainCommand) -> None:
        raise NotImplementedError()


class InMemoryDomainMessageBus(AbstractDomainMessageBus):
    def __init__(
        self,
        event_handlers: Optional[
            Dict[Type[events.DomainEvent], List[EventCallback]]
        ] = None,
        command_handlers: Optional[
            Dict[Type[commands.DomainCommand], CommandCallback]
        ] = None,
    ) -> None:
        self._event_handlers = event_handlers or defaultdict(lambda: [])
        self._command_handlers = command_handlers or {}

    def subscribe_to_event(
        self, event_type: Type[events.DomainEvent], callback: EventCallback
    ) -> None:
        if event_type in self._event_handlers:
            self._event_handlers[event_type].append(callback)
        else:
            self._event_handlers[event_type] = [callback]

    def subscribe_to_command(
        self, command_type: Type[commands.DomainCommand], callback: CommandCallback
    ) -> None:
        self._command_handlers[command_type] = callback

    def publish_event(self, event: events.DomainEvent) -> None:
        handlers = self._event_handlers.get(type(event))
        if handlers:
            print("Handle event ", type(event))
            for callback in handlers:
                callback(event)

    def publish_command(self, command: commands.DomainCommand) -> None:
        handler = self._command_handlers.get(type(command))
        if handler:
            print("Handle command ", type(command))
            return handler(command)
