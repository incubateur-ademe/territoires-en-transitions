import os
from typing import Dict, List, Type, Optional

import click

from business.domain.models import events, commands
from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
    InMemoryDomainMessageBus,
)
from business.domain.use_cases import *
from business.domain.use_cases.parse_and_convert_markdown_indicateurs_to_entities import (
    ParseAndConvertMarkdownIndicateursToEntities,
    Referentiel,
)
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
        commands.StoreReferentielActions
    ],
    events.IndicateurMarkdownConvertedToEntities: [
        commands.StoreReferentielIndicateurs
    ],
}

COMMAND_HANDLERS: Dict[Type[commands.DomainCommand], Type[UseCase]] = {
    commands.ParseMarkdownReferentielFolder: ParseMarkdownReferentielFolder,
    commands.ConvertMarkdownReferentielNodeToEntities: ConvertMarkdownReferentielNodeToEntities,
    commands.StoreReferentielActions: StoreReferentielActions,
    commands.ParseAndConvertMarkdownIndicateursToEntities: ParseAndConvertMarkdownIndicateursToEntities,
    commands.StoreReferentielIndicateurs: StoreReferentielIndicateurs,
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
            StoreReferentielActions(self.domain_message_bus, self.referentiel_repo),
            ParseAndConvertMarkdownIndicateursToEntities(
                self.domain_message_bus, self.referentiel_repo
            ),
            StoreReferentielIndicateurs(self.domain_message_bus, self.referentiel_repo),
        ]


def store_referentiels(
    repo_option: ReferetielsRepository,
    to_json: Optional[str],
    markdown_folder: str,
    actions: bool,
    indicateurs: bool,
    referentiel: Referentiel,
):
    """Parse, convert and store referentiels actions and indicateurs given IN/OUT folders.
    Note that we consider that the given markdown folder is organized as follow:
        - it contains 2 folders named "referentiels" and "indicateurs"
        - within each folder, a folder with the referentiel name
    Hence, markdown to parse will then be:
        - f"{markdown_foder}/referentiels/{referentiel}/*md"
        - f"{markdown_foder}/indicateurs/{referentiel}/*md"
    """

    print("json_path ", to_json)
    domain_message_bus = InMemoryDomainMessageBus()
    config = ReferentielConfig(
        domain_message_bus,
        env_variables=EnvironmentVariables(
            referentiels_repository=repo_option, referentiels_repo_json=to_json
        ),
    )
    prepare_bus(config, EVENT_HANDLERS, COMMAND_HANDLERS)

    actions_command = commands.ParseMarkdownReferentielFolder(
        os.path.join(markdown_folder, "referentiels", referentiel)
    )

    indicateurs_command = commands.ParseAndConvertMarkdownIndicateursToEntities(
        os.path.join(markdown_folder, "indicateurs", referentiel), referentiel
    )
    if actions:
        if indicateurs:
            domain_message_bus.subscribe_to_event(
                events.ReferentielActionsStored,
                lambda _: domain_message_bus.publish_command(indicateurs_command),
            )
        domain_message_bus.publish_command(actions_command)
    elif indicateurs:
        domain_message_bus.publish_command(indicateurs_command)
    return


# 3. Prepare domain event bus (dependencies infection)
@click.command()
@click.option(
    "--repo-option",
    prompt="Referentiel repository option",
)
@click.option(
    "--to-json",
    prompt="Repo Json path (required if repo-option==JSON) ",
    default="./data/referentiel_repository.json",
)
@click.option("--actions/--no-actions", is_flag=True, default=True)
@click.option("--indicateurs/--no-indicateurs", is_flag=True, default=True)
@click.option("--markdown-folder", default="../markdown")
@click.option("--referentiel")
def store_referentiels_command(
    repo_option: ReferetielsRepository,
    to_json: Optional[str],
    markdown_folder: str,
    actions: bool,
    indicateurs: bool,
    referentiel: Referentiel,
):
    """Parse, convert and store referentiels actions and indicateurs given IN/OUT folders.
    Note that we consider that the given markdown folder is organized as follow:
        - it contains 2 folders named "referentiels" and "indicateurs"
        - within each folder, a folder with the referentiel name
    Hence, markdown to parse will then be:
        - f"{markdown_foder}/referentiels/{referentiel}/*md"
        - f"{markdown_foder}/indicateurs/{referentiel}/*md"
    """
    store_referentiels(
        repo_option, to_json, markdown_folder, actions, indicateurs, referentiel
    )


if __name__ == "__main__":
    store_referentiels_command()


# Command lines
# --------------
# python business/entrypoints/referentiels.py --repo-option JSON --referentiel "cae"
# python business/entrypoints/referentiels.py --repo-option JSON --referentiel "eci"
# python business/entrypoints/referentiels.py --repo-option JSON --referentiel "crte" --no-actions
