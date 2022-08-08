from business.personnalisation.ports.personnalisation_repo import (
    InMemoryPersonnalisationRepository,
)
from business.utils.domain_message_bus import InMemoryDomainMessageBus

from business.evaluation.domain.use_cases.catch_up_unprocessed_reponse_update_event import (
    CatchUpUnprocessedReponseUpdateEvents,
)
from business.evaluation.domain.models import events

from tests.utils.spy_on_event import spy_on_event


def test_publishes_all_catched_up_events():
    bus = InMemoryDomainMessageBus()
    catch_up_event = events.TriggerPersonnalisationForCollectivite(collectivite_id=1)
    repo = InMemoryPersonnalisationRepository()
    repo.set_unprocessed_reponse_events([catch_up_event])

    use_case = CatchUpUnprocessedReponseUpdateEvents(bus, repo)
    published_events = spy_on_event(bus, events.TriggerPersonnalisationForCollectivite)
    use_case.execute()
    assert published_events == [catch_up_event]
