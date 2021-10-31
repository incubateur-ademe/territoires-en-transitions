from business.domain.models import commands, events
from business.domain.ports.domain_message_bus import InMemoryDomainMessageBus
from business.domain.ports.action_points_repo import InMemoryActionPointsRepository
from business.domain.ports.action_children_repo import InMemoryActionChildrenRepository
from business.domain.ports.action_definition_repo import InMemoryActionDefinitionRepository
from business.domain.use_cases.store_referentiel import StoreReferentiel

from tests.utils.spy_on_event import spy_on_event
from tests.utils.referentiel_factory import make_action_definition, make_action_children, make_action_points

definition_entities = [make_action_definition(action_id="eci", referentiel_id="eci"),
                        make_action_definition(action_id="eci_1",  referentiel_id="eci"),
                        make_action_definition(action_id="eci_2",  referentiel_id="eci"),
                        make_action_definition(action_id="eci_1.0",  referentiel_id="eci")
                        ]
children_entities = [make_action_children(action_id="eci", children_ids=["eci_1", "eci_2"]),
                    make_action_children(action_id="eci_1",  children_ids=["eci_1.0"]),
                    make_action_children(action_id="eci_2",  children_ids=[]),
                    make_action_children(action_id="eci_1.0",  children_ids=[])
                    ]
points_entities = [make_action_points(action_id="eci", points=10),
                    make_action_points(action_id="eci_1",  points=6),
                    make_action_points(action_id="eci_2",  points=4),
                    make_action_points(action_id="eci_1.0",  points=4)
                ]
                
def test_can_store_correct_referentiel():
    bus=InMemoryDomainMessageBus()
    points_repo=InMemoryActionPointsRepository()
    children_repo=InMemoryActionChildrenRepository() 
    definition_repo=InMemoryActionDefinitionRepository()

    use_case = StoreReferentiel(bus, points_repo, children_repo, definition_repo)
                    
    command = commands.StoreReferentielEntities(definition_entities, points_entities, children_entities, referentiel_id="eci")

    entity_stored_events = spy_on_event(bus, events.ReferentielStored)
    failure_events = spy_on_event(bus, events.ReferentielStorageFailed)

    use_case.execute(command)

    assert len(entity_stored_events) == 1
    assert len(failure_events) == 0
    assert len(points_repo.entities) == 4
    assert len(children_repo.entities) == 4
    assert len(definition_repo.entities) == 4


def test_wont_store_if_incoherent_children():
    bus=InMemoryDomainMessageBus()
    points_repo=InMemoryActionPointsRepository()
    children_repo=InMemoryActionChildrenRepository() 
    definition_repo=InMemoryActionDefinitionRepository()

    use_case = StoreReferentiel(bus, points_repo, children_repo, definition_repo)

    incoherent_children_entities = [make_action_children(action_id="eci", children_ids=["eci_1", "eci_2"]),
                    make_action_children(action_id="eci_1",  children_ids=["eci_1.0"]),
                    make_action_children(action_id="eci_2",  children_ids=["eci_1.1"]), # child "eci_1.1" is refered but not defined 
                    make_action_children(action_id="eci_1.0",  children_ids=[])
                    ]
                         
    command_with_incoherence = commands.StoreReferentielEntities(definition_entities, points_entities, incoherent_children_entities, referentiel_id="eci")

    entity_stored_events = spy_on_event(bus, events.ReferentielStored)
    failure_events = spy_on_event(bus, events.ReferentielStorageFailed)

    use_case.execute(command_with_incoherence)

    assert len(failure_events) == 1
    assert failure_events[0].reason == 'Inconsistency in action eci_2: some children id are refered but defined.'
    assert len(entity_stored_events) == 0
    assert len(points_repo.entities) == 0
    assert len(children_repo.entities) == 0
    assert len(definition_repo.entities) == 0