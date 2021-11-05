from business.domain.models.markdown_action_node import MarkdownActionNode
from business.domain.ports.domain_message_bus import InMemoryDomainMessageBus
from business.domain.use_cases.convert_markdown_indicateurs_to_entities import (
    ConvertMarkdownIndicateursToEntities,
)
from business.domain.models import commands, events
from tests.utils.spy_on_event import spy_on_event


def test_convert_markdown_indicateurs_to_entities_from_ok_folder():
    test_command = commands.ConvertMarkdownIndicateursToEntities(
        folder_path="./tests/data/md_indicateurs_example_ok"
    )
    bus = InMemoryDomainMessageBus()
    use_case = ConvertMarkdownIndicateursToEntities(bus=bus)

    # failure_events = spy_on_event(bus, events.ParseMarkdownReferentielFolderFailed)
    # parsed_events = spy_on_event(bus, events.MarkdownIndicateursConvertedToEntities)

    use_case.execute(test_command)

    # assert len(failure_events) == 0
    # assert len(parsed_events) == 1
