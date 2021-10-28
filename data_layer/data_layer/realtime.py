from rx import operators as op
from rx.subject import Subject

from data_layer.realtime_controller import RealtimeController
from data_layer.realtime_converters import EpciActionStatusUpdateConverter
from data_layer.realtime_sources import RawSource, EventSource


class Realtime:
    """The Real time part of the data layer
    Convert events from raw_source to typed events and push them into event_source"""

    def __init__(self, controller: RealtimeController = None):
        self.controller = controller
        self.raw_source: RawSource = Subject()
        self.event_source: EventSource = Subject()

        self.raw_source.pipe(
            op.filter(EpciActionStatusUpdateConverter.filter),
            op.map(EpciActionStatusUpdateConverter.convert),
        ).subscribe(self.event_source)

    def start(self):
        if self.controller is not None:
            self.controller.start(self)
