import os
from typing import Dict, List, Type, Optional

import click

from business.referentiel.domain.models import events
from business.core.domain.ports.domain_message_bus import (
    InMemoryDomainMessageBus,
)
from business.utils.use_case import UseCase
from business.referentiel.domain.use_cases import *

from business.utils.prepare_bus import prepare_bus
from business.utils.config import Config
from business.utils.environment_variables import (
    EnvironmentVariables,
    ReferentielsRepository,
)

# 1. Define message handlers (orchestration)

EVENT_HANDLERS: Dict[Type[events.DomainEvent], List[Type[UseCase]]] = {
    events.MarkdownReferentielFolderUpdated: [ParseMarkdownReferentielFolder],
    events.MarkdownReferentielFolderParsed: [ConvertMarkdownReferentielNodeToEntities],
    events.MarkdownReferentielNodeConvertedToEntities: [StoreReferentielActions],
    events.ParseAndConvertMarkdownIndicateursToEntitiesTriggered: [
        ParseAndConvertMarkdownIndicateursToEntities
    ],
    events.IndicateurMarkdownConvertedToEntities: [StoreReferentielIndicateurs],
    events.ExtractReferentielActionsToCsvTriggered: [ExtractReferentielActionsToCsv],
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
            ExtractReferentielActionsToCsv(referentiel_repo=self.referentiel_repo),
        ]


def store_referentiels(
    repo_option: ReferentielsRepository,
    to_json: Optional[str],
    markdown_folder: str,
    actions: bool,
    indicateurs: bool,
    referentiel: ActionReferentiel,
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
            referentiels_repository=repo_option, referentiels_repo_file=to_json
        ),
    )
    prepare_bus(
        config,
        event_handlers=EVENT_HANDLERS,
    )

    actions_trigger = events.MarkdownReferentielFolderUpdated(
        os.path.join(markdown_folder, "referentiels", referentiel)
    )

    indicateurs_trigger = events.ParseAndConvertMarkdownIndicateursToEntitiesTriggered(
        os.path.join(markdown_folder, "indicateurs", referentiel), referentiel
    )
    if actions:
        if indicateurs:
            domain_message_bus.subscribe_to_event(
                events.ReferentielActionsStored,
                lambda _: domain_message_bus.publish_event(indicateurs_trigger),
            )
        domain_message_bus.publish_event(actions_trigger)
    elif indicateurs:
        domain_message_bus.publish_event(indicateurs_trigger)
    return


# 3. Prepare domain event bus (dependencies infection)
@click.command()
@click.option(
    "--repo-option",
    prompt="Referentiel repository option (JSON | SQL | SUPABASE ) ",
)
@click.option(
    "--to-file",
    default="./data/referentiel_repository.json",
    required=False,
)
@click.option("--actions/--no-actions", is_flag=True, default=True)
@click.option("--indicateurs/--no-indicateurs", is_flag=True, default=True)
@click.option("--markdown-folder", default="../markdown")
@click.option("--referentiel")
def store_referentiels_command(
    repo_option: ReferentielsRepository,
    to_file: Optional[str],
    markdown_folder: str,
    actions: bool,
    indicateurs: bool,
    referentiel: ActionReferentiel,
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
        repo_option, to_file, markdown_folder, actions, indicateurs, referentiel
    )


if __name__ == "__main__":
    store_referentiels_command()


# Command lines
# --------------
# python business/referentiel/entrypoints/cli.py --repo-option JSON --referentiel "cae"
# python business/referentiel/entrypoints/cli.py --repo-option JSON --referentiel "eci"
# python business/referentiel/entrypoints/cli.py --repo-option JSON --referentiel "crte" --no-actions
