from pathlib import Path
from typing import Dict, List, Literal, Type, Optional

import click

from business.domain.models import events, commands
from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
    InMemoryDomainMessageBus,
)
from business.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.domain.use_cases import *
from business.entrypoints.prepare_bus import prepare_bus
from business.entrypoints.config import Config
from business.adapters.json_referentiel_repo import JsonReferentielRepository

# 1. Define message handlers (orchestration)

EVENT_HANDLERS: Dict[Type[events.DomainEvent], List[Type[commands.DomainCommand]]] = {
    events.MarkdownReferentielFolderParsed: [
        commands.ConvertMarkdownReferentielNodeToEntities
    ],
    events.MarkdownReferentielNodeConvertedToEntities: [
        commands.StoreReferentielEntities
    ],
}

COMMAND_HANDLERS: Dict[Type[commands.DomainCommand], Type[UseCase]] = {
    commands.ParseMarkdownReferentielFolder: ParseMarkdownReferentielFolder,
    commands.ConvertMarkdownReferentielNodeToEntities: ConvertMarkdownReferentielNodeToEntities,
    commands.StoreReferentielEntities: StoreReferentiel,
}

# 2. Define config (necessary abstraction)
class ReferentielConfig(Config):
    def __init__(
        self,
        referentiel_repo: AbstractReferentielRepository,
        domain_message_bus: AbstractDomainMessageBus,
    ) -> None:
        super().__init__(domain_message_bus)
        self.referentiel_repo = referentiel_repo

    def prepare_use_cases(self) -> List[UseCase]:

        return [
            ConvertMarkdownReferentielNodeToEntities(self.domain_message_bus),
            ParseMarkdownReferentielFolder(self.domain_message_bus),
            StoreReferentiel(self.domain_message_bus, self.referentiel_repo),
        ]


# 3. Prepare domain event bus (dependencies infection)


@click.command()
@click.option(
    "--repo-option",
    prompt="Referentiel repository option",
)
@click.option(
    "--json-path",
    prompt="Repo Json path (required if repo-option==JSON) ",
    default="./data/referentiel_repository.json",
)
@click.argument(
    "markdown-folder",
)
def update(
    repo_option: Literal["SUPABASE", "JSON"],
    json_path: Optional[str],
    markdown_folder: str,
):
    """Simple program that greets NAME for a total of COUNT times."""
    print("json_path ", json_path)
    domain_message_bus = InMemoryDomainMessageBus()
    if repo_option == "JSON":
        if json_path is None:
            raise ValueError("Json path should be specified if repo-option == JSON")
        referentiel_repo = JsonReferentielRepository(Path(json_path))
    else:
        raise NotImplementedError
    config = ReferentielConfig(referentiel_repo, domain_message_bus)
    prepare_bus(config, EVENT_HANDLERS, COMMAND_HANDLERS)

    config.domain_message_bus.publish_command(
        commands.ParseMarkdownReferentielFolder(markdown_folder)
    )
    return


if __name__ == "__main__":
    update()


# Command lines
# --------------
# python business/entrypoints/referentiels.py --repo-option JSON --markdown-folder "../markdown/referentiels/eci"
# python business/entrypoints/referentiels.py --repo-option JSON --markdown-folder "../markdown/referentiels/cae"
