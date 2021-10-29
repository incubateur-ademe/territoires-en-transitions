from typing import List
from business.domain.models import commands, events
from business.domain.ports.domain_message_bus import InMemoryDomainMessageBus
from business.domain.use_cases.parse_markdown_referentiel_folder import ParseMarkdownReferentielFolder
from business.domain.use_cases.convert_markdown_referentiel_node_to_entities import ConvertMarkdownReferentielNodeToEntities

from tests.utils.spy_on_event import spy_on_event

# TODO : this should be handled by server instead of being a scenario
def test_build_economie_circulaire():
    test_command = commands.ParseMarkdownReferentielFolder(
        folder_path="./data/referentiels/eci", referentiel_id="eci"
    )
    bus = InMemoryDomainMessageBus()
    use_case = ParseMarkdownReferentielFolder(bus=bus)

    parsing_failure_events: List[events.ParseMarkdownReferentielFolderFailed] = spy_on_event(bus, events.ParseMarkdownReferentielFolderFailed)
    folder_parsed_events: List[events.MarkdownReferentielFolderParsed] = spy_on_event(bus, events.MarkdownReferentielFolderParsed)

    use_case.execute(test_command)

    assert len(parsing_failure_events) == 0
    assert len(folder_parsed_events) == 1 

    use_case = ConvertMarkdownReferentielNodeToEntities(bus=bus)
    command = commands.ConvertMarkdownReferentielNodeToEntities(referentiel_node=folder_parsed_events[0].referentiel_node)


    markdown_converted_events: List[events.MarkdownReferentielNodeConvertedToEntities] = spy_on_event(bus, events.MarkdownReferentielNodeConvertedToEntities)
    inconsistency_found_events: List[events.FoundMarkdownReferentielNodeInconsistency] = spy_on_event(bus, events.FoundMarkdownReferentielNodeInconsistency)

    use_case.execute(command)

    assert len(inconsistency_found_events) == 0
    assert len(markdown_converted_events) == 1
    
    expected_nb_of_action_in_eci = 367
    assert  len(markdown_converted_events[0].definitions) == len(markdown_converted_events[0].definitions) == expected_nb_of_action_in_eci
