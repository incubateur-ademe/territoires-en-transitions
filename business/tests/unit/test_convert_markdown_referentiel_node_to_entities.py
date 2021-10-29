from typing import List, Tuple
import pytest
from business.domain.models import commands, events
from business.domain.models.action_points import ActionPoints

from business.domain.models.markdown_action_node import MarkdownActionNode
from business.domain.ports.domain_message_bus import InMemoryDomainMessageBus
from business.domain.use_cases.convert_markdown_referentiel_node_to_entities import (
    ConvertMarkdownReferentielNodeToEntities,
)
from tests.utils.referentiel_factory import (
    make_markdown_action_node,
    set_markdown_action_node_children_with_points,
)
from tests.utils.spy_on_event import spy_on_event

def prepare_use_case(
    markdown_root_action_node: MarkdownActionNode,
) -> Tuple[List[events.MarkdownReferentielNodeConvertedToEntities], List[events.FoundMarkdownReferentielNodeInconsistency]]:
    bus = InMemoryDomainMessageBus()
    command = commands.ConvertMarkdownReferentielNodeToEntities(markdown_root_action_node)
    node_converted_events = spy_on_event(bus, events.MarkdownReferentielNodeConvertedToEntities)
    conversion_failed_events = spy_on_event(bus, events.FoundMarkdownReferentielNodeInconsistency)

    use_case = ConvertMarkdownReferentielNodeToEntities(bus)
    use_case.execute(command)
    return node_converted_events, conversion_failed_events

def test_import_referentiel_succeeds_when_all_is_good():
    markdown_root_action_node = make_markdown_action_node(
        identifiant="", points=100, referentiel_id="eci"
    )
    markdown_root_action_node.actions = [
        make_markdown_action_node(identifiant="1",  points=30,
            actions=[make_markdown_action_node(identifiant="1.1"), 
                     make_markdown_action_node(identifiant="1.2"),
                     make_markdown_action_node(identifiant="1.3")]
        ),
        make_markdown_action_node(identifiant="2", points=70,
            actions=[make_markdown_action_node(identifiant="2.1"), 
                     make_markdown_action_node(identifiant="2.2")]),
    ]
    (
       node_converted_events, conversion_failed_events

    ) = prepare_use_case(markdown_root_action_node)

    assert len(node_converted_events) == 1
    assert len(conversion_failed_events) == 0

    breakpoint()
    # assert node_converted_events[0].points == 
    # assert node_converted_events[0].definitions == 
    # assert node_converted_events[0].children == 

def test_import_referentiel_fails_when_identifiants_are_not_unique():

    markdown_root_action_node = make_markdown_action_node(
        identifiant="root", points=100
    )
    markdown_root_action_node.actions = [
        make_markdown_action_node(identifiant="1"),
        make_markdown_action_node(identifiant="1"),
    ]
    (
       node_converted_events, conversion_failed_events

    ) = prepare_use_case(markdown_root_action_node)

    assert len(node_converted_events) == 0
    assert len(conversion_failed_events) == 1
    assert conversion_failed_events[0].reason == "Tous les identifiants devraient être uniques. Doublons: "




def test_check_referentiel_quotations_fails_when_percentage_level_isnt_100():

    markdown_root_action_node = make_markdown_action_node(identifiant="root", points=500)
    markdown_root_action_node.actions = [
        make_markdown_action_node(identifiant="1", percentage=10),
        make_markdown_action_node(identifiant="2", percentage=80),
    ]
    (
       node_converted_events, conversion_failed_events

    ) = prepare_use_case(markdown_root_action_node)

    assert len(node_converted_events) == 0
    assert len(conversion_failed_events) == 1
    assert conversion_failed_events[0].reason == "Les valeurs des actions 1, 2 sont renseignées en pourcentage, mais leur somme fait 90.0 au lieu de 100."
   


def test_check_referentiel_quotations_fails_when_children_points_doesnt_sum_to_parent_point():

    markdown_root_action_node = make_markdown_action_node(identifiant="root", points=60)
    set_markdown_action_node_children_with_points(markdown_root_action_node, [10, 51])

    (
       node_converted_events, conversion_failed_events

    ) = prepare_use_case(markdown_root_action_node)

    assert len(node_converted_events) == 0
    assert len(conversion_failed_events) == 1
    assert conversion_failed_events[0].reason == "Les valeurs des actions de l'action eci_root sont renseignées en points, mais leur somme fait 61.0 au lieu de 60.0."
    

def test_check_referentiel_quotations_handles_points_parent_propagation_when_necessary_and_fails_if_incoherent():
    root_action = make_markdown_action_node(identifiant="", points=20)
    action_1 = make_markdown_action_node(
        identifiant="1", percentage=50
    )  # hence worth 10 points
    action_2 = make_markdown_action_node(
        identifiant="2", percentage=50
    )  # hence worth 10 points
    root_action.actions = [action_1, action_2]
    action_1.actions = [  # All good : it sums to 10
        make_markdown_action_node(identifiant="1.1", points=8),
        make_markdown_action_node(identifiant="1.2", points=2),
        make_markdown_action_node(identifiant="1.3", points=0),
    ]
    action_2.actions = [  # Not good : it sums to 7 instead of 10
        make_markdown_action_node(identifiant="2.1", points=7),
    ]
    (
       node_converted_events, conversion_failed_events

    ) = prepare_use_case(root_action)

    assert len(node_converted_events) == 0
    assert len(conversion_failed_events) == 1
    assert conversion_failed_events[0].reason == "Les valeurs des actions de l'action eci_2 sont renseignées en points, mais leur somme fait 7.0 au lieu de 10.0."


def test_check_referentiel_quotations_handles_children_propagation_when_necessary():
    root_action = make_markdown_action_node(identifiant="root", points=500)
    action_1 = make_markdown_action_node(
        identifiant="1"
    )  # no points specified but children have points that sum to 400
    action_2 = make_markdown_action_node(
        identifiant="2"
    )  # no points specified but children have points that sum to 99
    root_action.actions = [action_1, action_2]

    set_markdown_action_node_children_with_points(action_1, [100, 200, 100])
    set_markdown_action_node_children_with_points(action_2, [99])

    (
       node_converted_events, conversion_failed_events

    ) = prepare_use_case(root_action)

    assert len(node_converted_events) == 0
    assert len(conversion_failed_events) == 1
    assert conversion_failed_events[0].reason == "Les valeurs des actions de l'action eci_root sont renseignées en points, mais leur somme fait 499.0 au lieu de 500.0."
    
