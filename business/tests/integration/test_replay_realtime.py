from typing import List

from business.utils.domain_message_bus import (
    InMemoryDomainMessageBus,
)

from business.evaluation.adapters.replay_realtime import ReplayRealtime
from business.evaluation.domain.ports.realtime import (
    AbstractConverter,
    CollectiviteActionStatutUpdateConverter,
    CollectiviteActivationConverter,
    CollectiviteReponseUpdateConverter,
)
from business.evaluation.domain.models import events

from tests.utils.spy_on_event import spy_on_event

# Test realtime on event status update


def test_domain_event_published_on_replay_correct_realtime_status_update_observer():
    bus = InMemoryDomainMessageBus()
    converters: List[AbstractConverter] = [CollectiviteActionStatutUpdateConverter()]
    realtime = ReplayRealtime(bus, converters=converters)
    realtime.set_events_to_emit(
        [
            {
                "record": {
                    "referentiel": "eci",
                    "collectivite_id": 1,
                    "created_at": "2020-01-01T12",
                    "id": 42,
                },
                "table": "action_statut_update_event",
            }
        ]
    )
    failure_events = spy_on_event(bus, events.RealtimeEventWithWrongFormatObserved)
    corresponding_domain_events = spy_on_event(
        bus, events.TriggerNotationForCollectiviteForReferentiel
    )

    realtime.start()

    assert len(failure_events) == 0
    assert len(corresponding_domain_events) == 1

    assert corresponding_domain_events[
        0
    ] == events.TriggerNotationForCollectiviteForReferentiel(
        collectivite_id=1, referentiel="eci"
    )


def test_failure_published_when_realtime_status_update_event_has_unknown_referentiel():
    bus = InMemoryDomainMessageBus()
    converters: List[AbstractConverter] = [CollectiviteActionStatutUpdateConverter()]
    realtime = ReplayRealtime(bus, converters=converters)

    realtime.set_events_to_emit(
        [
            {
                "record": {
                    "referentiel": "toto",
                    "collectivite_id": 1,
                    "created_at": "2020-01-01T12",
                    "id": 42,
                },
                "table": "action_statut_update_event",
            }
        ]
    )
    failure_events = spy_on_event(bus, events.RealtimeEventWithWrongFormatObserved)

    realtime.start()

    assert len(failure_events) == 1
    assert (
        failure_events[0].reason
        == "Realtime event with wrong format: {'referentiel': ['Must be one of: eci, cae.']}"
    )


def test_realtime_event_has_wrong_record_format():
    bus = InMemoryDomainMessageBus()
    converters: List[AbstractConverter] = [CollectiviteActionStatutUpdateConverter()]
    realtime = ReplayRealtime(bus, converters=converters)

    realtime.set_events_to_emit(
        [
            {
                "record": {
                    "referentiel": "eci",
                    "created_at": "2020-01-01T12",
                    "id": 42,
                },
                "table": "action_statut_update_event",
            }
        ]
    )

    failure_events = spy_on_event(bus, events.RealtimeEventWithWrongFormatObserved)

    realtime.start()

    assert len(failure_events) == 1

    assert (
        failure_events[0].reason
        == "Realtime event with wrong format: {'collectivite_id': ['Missing data for required field.']}"
    )


# Test realtime on event reponse update
def test_domain_event_published_on_replay_correct_realtime_reponse_update_observer():
    bus = InMemoryDomainMessageBus()
    converters: List[AbstractConverter] = [CollectiviteReponseUpdateConverter()]
    realtime = ReplayRealtime(bus, converters=converters)
    realtime.set_events_to_emit(
        [
            {
                "record": {
                    "collectivite_id": 1,
                    "created_at": "2020-01-01T12",
                    "id": 42,
                },
                "table": "reponse_update_event",
            }
        ]
    )
    failure_events = spy_on_event(bus, events.RealtimeEventWithWrongFormatObserved)
    corresponding_domain_events = spy_on_event(
        bus, events.TriggerPersonnalisationForCollectivite
    )

    realtime.start()

    assert len(failure_events) == 0
    assert len(corresponding_domain_events) == 1

    assert corresponding_domain_events[
        0
    ] == events.TriggerPersonnalisationForCollectivite(collectivite_id=1)


# Test realtime on event collectivite activated
def test_domain_event_published_on_replay_correct_realtime_collectivite_observer():
    bus = InMemoryDomainMessageBus()
    converters: List[AbstractConverter] = [CollectiviteActivationConverter()]
    realtime = ReplayRealtime(bus, converters=converters)
    realtime.set_events_to_emit(
        [
            {
                "record": {
                    "collectivite_id": 1,
                    "created_at": "2020-01-01T12",
                    "id": 42,
                },
                "table": "collectivite_activation_event",
            }
        ]
    )
    failure_events = spy_on_event(bus, events.RealtimeEventWithWrongFormatObserved)
    corresponding_domain_events = spy_on_event(
        bus, events.TriggerPersonnalisationForCollectivite
    )

    realtime.start()

    assert len(failure_events) == 0
    assert len(corresponding_domain_events) == 1

    assert corresponding_domain_events[
        0
    ] == events.TriggerPersonnalisationForCollectivite(collectivite_id=1)
