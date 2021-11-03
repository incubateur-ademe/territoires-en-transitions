import json

import rx
from rx import operators as op

from realtime import Realtime
from realtime.models.events import EpciActionStatusUpdateEvent

RAW_EVENTS_DIR = "tests/supabase_realtime_events"


def test_sync():
    # load a file with recorded events
    with open(f"{RAW_EVENTS_DIR}/epci_action_statut_update.json", "r") as event_file:
        data = event_file.read()
        raw_events: list = json.loads(data)
    assert raw_events

    # the outputs of both raw events from supa and events from our data layer
    raw_outputs = []
    event_outputs = []
    event_filtered = []

    # initialize our realtime layer
    realtime = Realtime()

    # the raw source to pipe raw events in
    raw_source = realtime.raw_source

    # listen to raw and event sources
    raw_source.subscribe(lambda value: raw_outputs.append(value))
    realtime.event_source.subscribe(lambda value: event_outputs.append(value))
    realtime.event_source.pipe(
        # here we filter the events by type like the business would do
        op.filter(lambda event: type(event) == EpciActionStatusUpdateEvent)
    ).subscribe(lambda value: event_filtered.append(value))

    # pipe raw_events list into the raw_source our data layer is listening on
    rx.of(*raw_events).subscribe(raw_source)

    assert (
        len(raw_events) == len(raw_outputs) == len(event_outputs) == len(event_filtered)
    )

    for i in range(0, len(raw_events), 1):
        assert raw_events[i]["record"]["epci_id"] == event_outputs[i].epci_id
