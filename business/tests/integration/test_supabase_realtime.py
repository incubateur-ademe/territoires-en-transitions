from typing import List

from business.adapters.supabase_realtime import SupabaseRealtime
from business.domain.ports.domain_message_bus import (
    InMemoryDomainMessageBus,
)

from business.domain.ports.realtime import (
    AbstractConverter,
    EpciActionStatutUpdateConverter,
)
from business.domain.models import events

from tests.utils.spy_on_event import spy_on_event


def test_domain_event_published_on_replay_correct_realtime_status_update_observer():
    bus = InMemoryDomainMessageBus()
    converters: List[AbstractConverter] = [EpciActionStatutUpdateConverter()]
    socket = Socket()
    realtime = SupabaseRealtime(bus, converters=converters, socket=socket)

    # Mock INSERT in SupaBase socket = lyon, eci

    # realtime.set_events_to_emit(
    #     [
    #         {
    #             "record": {
    #                 "referentiel_id": "eci",
    #                 "epci_id": "lyon",
    #             },
    #             "table": "epci_action_statut_update",
    #         }
    #     ]
    # )
    failure_events = spy_on_event(bus, events.RealtimeEventWithWrongFormatObserved)
    corresponding_domain_events = spy_on_event(bus, events.ActionStatusUpdatedForEpci)

    realtime.start()

    assert len(failure_events) == 0
    assert len(corresponding_domain_events) == 1
    assert corresponding_domain_events[0] == events.ActionStatusUpdatedForEpci(
        epci_id="lyon", referentiel_id="eci"
    )
