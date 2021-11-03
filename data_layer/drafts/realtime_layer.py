import json

import rx
from rx.subject import Subject

from data_layer.realtime import Realtime

RAW_EVENTS_DIR = '../tests/supabase_realtime_events'

if __name__ == "__main__":
    raw_source = Subject()
    realtime = Realtime(raw_source)
    realtime.event_source.subscribe(lambda value: print("Event: {0}".format(value)))
    raw_source.subscribe(lambda value: print("Raw: {0}".format(value)))

    with open(f'{RAW_EVENTS_DIR}/epci_action_statut_update.json', 'r') as event_file:
        data = event_file.read()

    raw_events: list = json.loads(data)
    rx.of(*raw_events).subscribe(raw_source)
