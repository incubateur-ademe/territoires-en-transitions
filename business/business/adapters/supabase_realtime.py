import json
from pathlib import Path
from typing import List, Dict

from rx.core.typing import Subject
from realtime_py import Socket
import rx

from business.domain.ports.realtime import AbstractConverter
from domain.ports.realtime import AbstractRealtime
from domain.ports.domain_message_bus import AbstractDomainMessageBus


class ReplayRealtime(AbstractRealtime):
    def __init__(
        self,
        path: Path,
        domain_message_bus: AbstractDomainMessageBus,
        converters=List[AbstractConverter],
    ):  # observer: Subject
        # self.observer = observer
        self.events_to_replay = self.load_events_to_replay(path)
        super().__init__(domain_message_bus, converters)

    def start(self) -> None:
        rx.of(*self.events_to_replay).subscribe(self.external_observable)

    @staticmethod
    def load_events_to_replay(path: Path) -> List[Dict]:
        with open(path, "r") as event_file:
            data = event_file.read()
            events_to_replay: list = json.loads(data)
        return events_to_replay


class SupabaseRealtimeController:
    def __init__(
        self,
        socket: Socket,
        observer: Subject,
    ):
        self.socket = socket
        self.observer = observer

    def start(self) -> None:
        channel = self.socket.set_channel("realtime:public:epci_action_statut_update")
        channel.join().on("INSERT", self.observer.on_next)


class SupabaseRealtime(AbstractRealtime):
    """The Real time part of the data layer
    Convert events from raw_source to typed events and push them into event_source"""

    def __init__(
        self,
        socket: Socket,
        domain_message_bus: AbstractDomainMessageBus,
        converters=List[AbstractConverter],
    ):
        super().__init__(domain_message_bus, converters=converters)
        self.controller = SupabaseRealtimeController(socket, self.external_observable)

    def start(self):
        self.controller.start()
