import json
from pathlib import Path
from typing import List, Dict, Optional

import rx

from business.domain.ports.realtime import AbstractConverter, AbstractRealtime
from business.domain.ports.domain_message_bus import AbstractDomainMessageBus


class ReplayRealtime(AbstractRealtime):
    def __init__(
        self,
        domain_message_bus: AbstractDomainMessageBus,
        *,
        converters: List[AbstractConverter],
        events_to_emit: Optional[List[Dict]] = None,
        json_path: Optional[Path] = None,
    ):
        if events_to_emit is not None:
            self.events_to_emit = events_to_emit
        elif json_path is not None:
            self.events_to_emit = self.load_json(json_path)
        else:
            self.events_to_emit = []
        super().__init__(domain_message_bus, converters)

    def start(self) -> None:
        rx.of(*self.events_to_emit).subscribe(self.external_observable)

    @staticmethod
    def load_json(path: Path) -> List[Dict]:
        with open(path, "r") as event_file:
            data = event_file.read()
            json_events: list = json.loads(data)
        return json_events

    def set_events_to_emit(self, events: List[Dict]):
        self.events_to_emit = events
