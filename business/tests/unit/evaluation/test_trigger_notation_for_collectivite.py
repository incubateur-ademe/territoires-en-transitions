from business.evaluation.domain.models.unprocessed_action_statut_update_event_read import (
    UnprocessedActionStatutUpdateEventRead,
)
from business.utils.domain_message_bus import InMemoryDomainMessageBus
from business.evaluation.domain.ports.action_statut_update_event_repo import (
    InMemoryActionStatutUpdateEventRepository,
)
from business.evaluation.domain.use_cases.catch_up_unprocessed_action_status_update_events import (
    CatchUpUnprocessedActionStatusUpdateEvents,
)
from tests.utils.spy_on_event import spy_on_event
from business.evaluation.domain.models import events


def test_catch_up_unprocessed_action_status_update_event():
    bus = InMemoryDomainMessageBus()
    catch_up_event = UnprocessedActionStatutUpdateEventRead(
        collectivite_id=1, referentiel="cae", created_at="2020-01-01"
    )
    repo = InMemoryActionStatutUpdateEventRepository([catch_up_event])
    test_catch_up_unprocessed_action_status_update_event = (
        CatchUpUnprocessedActionStatusUpdateEvents(bus, repo)
    )
    published_events = spy_on_event(
        bus, events.TriggerNotationForCollectiviteForReferentiel
    )
    test_catch_up_unprocessed_action_status_update_event.execute()
    assert len(published_events) == 1
