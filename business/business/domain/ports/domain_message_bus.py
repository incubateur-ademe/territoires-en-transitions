import abc
import asyncio
from collections import defaultdict
from typing import Any, Callable, Coroutine, Dict, List, Optional, Type

from business.domain.models import commands, events

# EventCallback = Callable[[Any], Coroutine[Any, Any, Any]]
EventCallback = Callable[[Any], Any]


class AbstractDomainMessageBus(abc.ABC):
    _event_handlers: Dict[Type[events.DomainEvent], List[Callable]]
    _command_handlers: Dict[Type[commands.DomainCommand], Callable]

    @abc.abstractclassmethod
    def subscribe_to_event(
        self, event_type: Type[events.DomainEvent], callback: Callable
    ) -> None:
        raise NotImplementedError()

    @abc.abstractclassmethod
    def publish_event(self, event: events.DomainEvent) -> None:
        raise NotImplementedError()

    @abc.abstractclassmethod
    async def publish_command(self, command: commands.DomainCommand) -> None:
        raise NotImplementedError()


class InMemoryDomainMessageBus(AbstractDomainMessageBus):
    def __init__(
        self,
        event_handlers: Optional[Dict[Type[events.DomainEvent], List[Callable]]] = None,
        command_handlers: Optional[Dict[Type[commands.DomainCommand], Callable]] = None,
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
