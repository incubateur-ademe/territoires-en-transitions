from typing import Dict, List, Type, Optional

import click

from business.domain.models import events, commands
from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
    InMemoryDomainMessageBus,
)
from business.domain.use_cases import *
from business.entrypoints.prepare_bus import prepare_bus
from business.entrypoints.config import Config
from business.entrypoints.environment_variables import (
    EnvironmentVariables,
    ReferetielsRepository,
)

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
        domain_message_bus: AbstractDomainMessageBus,
        env_variables: EnvironmentVariables,
    ) -> None:
        super().__init__(domain_message_bus, env_variables=env_variables)
        self.referentiel_repo = self.get_referentiel_repo()

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
    repo_option: ReferetielsRepository,
    json_path: Optional[str],
    markdown_folder: str,
):
    """Simple program that greets NAME for a total of COUNT times."""
    print("json_path ", json_path)
    domain_message_bus = InMemoryDomainMessageBus()
    config = ReferentielConfig(
        domain_message_bus,
        env_variables=EnvironmentVariables(
            referentiels_repository=repo_option, referentiels_repo_json=json_path
        ),
    )
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
