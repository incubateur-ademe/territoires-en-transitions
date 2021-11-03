import os
from typing import Dict, List, Literal, Type

import click

from business.domain.models import events, commands
from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
    InMemoryDomainMessageBus,
)
from business.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
    InMemoryReferentielRepository,
)
from business.domain.use_cases import *
from business.entrypoints.prepare_bus import prepare_bus
from business.entrypoints.config import Config

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
    # option=["SUPABASE", "IN_MEMORY"],
)
@click.option(
    "--markdown-folder",
    prompt="Path to folder containing referentiel definitions in markdowns",
)
def update(repo_option: Literal["SUPABASE", "IN_MEMORY"], markdown_folder: str):
    """Simple program that greets NAME for a total of COUNT times."""
    domain_message_bus = InMemoryDomainMessageBus()
    if repo_option == "IN_MEMORY":
        referentiel_repo = InMemoryReferentielRepository()
    else:
        raise NotImplementedError
    config = ReferentielConfig(referentiel_repo, domain_message_bus)
    prepare_bus(config, EVENT_HANDLERS, COMMAND_HANDLERS)

    config.domain_message_bus.publish_command(
        commands.ParseMarkdownReferentielFolder(markdown_folder)
    )


if __name__ == "__main__":
    update()


# Command lines
# --------------
# python business/entrypoints/referentiels.py --repo-option IN_MEMORY --markdown-folder "./data/referentiels/eci"
# python business/entrypoints/referentiels.py --repo-option IN_MEMORY --markdown-folder "./data/referentiels/cae"
