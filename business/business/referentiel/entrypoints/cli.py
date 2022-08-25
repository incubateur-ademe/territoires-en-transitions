import os
import sys
from typing import Dict, List, Type, Optional

import click

from business.referentiel.domain.models import events
from business.utils.domain_message_bus import (
    DomainFailureEvent,
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


class SystemExit(UseCase):
    def execute(self, failure: DomainFailureEvent):
        sys.exit(f"Erreur dans le traitement des fichiers markdowns : {failure.reason}")


# 1. Define message handlers (orchestration)
EVENT_HANDLERS: Dict[Type[events.DomainEvent], List[Type[UseCase]]] = {
    # Actions
    events.MarkdownReferentielFolderUpdated: [ParseMarkdownReferentielFolder],
    events.MarkdownReferentielFolderParsed: [ConvertMarkdownReferentielNodeToEntities],
    events.MarkdownReferentielNodeConvertedToEntities: [StoreReferentielActions],
    # Indicateurs
    events.ParseAndConvertMarkdownIndicateursToEntitiesTriggered: [
        ParseAndConvertMarkdownIndicateursToEntities
    ],
    events.IndicateurMarkdownConvertedToEntities: [StoreReferentielIndicateurs],
    # Preuves
    events.ParseAndStorePreuvesTriggered: [ParseAndStorePreuves],
    # Personnalisation : Questions and regles
    events.ParseAndConvertMarkdownPersonnalisationsTriggered: [
        ParseAndConvertMarkdownReferentielQuestions
    ],
    events.QuestionMarkdownConvertedToEntities: [
        ParseAndConvertMarkdownReferentielRegles
    ],
    events.QuestionAndPersonnalisationMarkdownConvertedToEntities: [
        CheckPersonnalisation
    ],
    events.QuestionAndReglesChecked: [StoreReferentielPersonnalisations],
    # Csv extraction
    events.ExtractReferentielActionsToCsvTriggered: [ExtractReferentielActionsToCsv],
    # Exit on DomainFailureEvent
    events.ParseMarkdownReferentielFolderFailed: [SystemExit],
    events.ReferentielStorageFailed: [SystemExit],
    events.IndicateurMarkdownParsingOrConvertionFailed: [SystemExit],
    events.MarkdownReferentielNodeInconsistencyFound: [SystemExit],
    events.QuestionAndReglesCheckingFailed: [SystemExit],
    DomainFailureEvent: [SystemExit],
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
            # Actions
            ConvertMarkdownReferentielNodeToEntities(self.domain_message_bus),
            ParseMarkdownReferentielFolder(self.domain_message_bus),
            StoreReferentielActions(self.domain_message_bus, self.referentiel_repo),
            ExtractReferentielActionsToCsv(referentiel_repo=self.referentiel_repo),
            # Indicateurs
            StoreReferentielIndicateurs(self.domain_message_bus, self.referentiel_repo),
            ParseAndConvertMarkdownIndicateursToEntities(
                self.domain_message_bus, self.referentiel_repo
            ),
            # Preuves
            ParseAndStorePreuves(self.domain_message_bus, self.referentiel_repo),
            # Personnalisation
            ParseAndConvertMarkdownReferentielQuestions(
                self.domain_message_bus, self.referentiel_repo
            ),
            ParseAndConvertMarkdownReferentielRegles(
                self.domain_message_bus, self.referentiel_repo
            ),
            StoreReferentielPersonnalisations(
                self.domain_message_bus, self.referentiel_repo
            ),
            CheckPersonnalisation(self.domain_message_bus, self.referentiel_repo),
            # Exit
            SystemExit(),
        ]


# 3. Prepare CLI
@click.group()
def cli_update_referentiel():
    pass


@click.group()
def cli_update_questions_and_personnalisations():
    pass


cli = click.CommandCollection(
    sources=[cli_update_referentiel, cli_update_questions_and_personnalisations]
)

# 4. Prepare domain event bus (dependencies injection)
# 4.a - To update referentiels


def prepare_bus_to_store_referentiels(
    repo_option: ReferentielsRepository,
    to_json: Optional[str],
    markdown_folder: str,
    update_actions: bool,
    update_indicateurs: bool,
    referentiel: Optional[ActionReferentiel] = None,
):
    """Parse, convert and store referentiels actions and indicateurs given IN/OUT folders.
    Note that we consider that the given markdown folder is organized as follow:
        - it contains 2 folders named "referentiels" and "indicateurs"
        - within each folder, a folder with the referentiel name
    Hence, markdown to parse will then be:
        - f"{markdown_foder}/referentiels/{referentiel}/*md"
        - f"{markdown_foder}/indicateurs/{referentiel}/*md"
    """

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

    refs_to_update: List[ActionReferentiel] = (
        ["eci", "cae", "crte"] if not referentiel else [referentiel]
    )
    for ref_to_update in refs_to_update:
        subscribe_bus_to_update_actions_and_indicateurs_of_referentiel(
            update_actions=update_actions,
            update_indicateurs=update_indicateurs,
            domain_message_bus=domain_message_bus,
            markdown_folder=markdown_folder,
            referentiel=ref_to_update,
        )
    domain_message_bus.publish_event(
        events.ParseAndStorePreuvesTriggered(
            os.path.join(markdown_folder, "preuves"),
        )
    )
    return


def subscribe_bus_to_update_actions_and_indicateurs_of_referentiel(
    update_actions: bool,
    update_indicateurs: bool,
    domain_message_bus: AbstractDomainMessageBus,
    markdown_folder: str,
    referentiel: ActionReferentiel,
):
    actions_trigger = events.MarkdownReferentielFolderUpdated(
        os.path.join(markdown_folder, "referentiels", referentiel)
    )

    indicateurs_trigger = events.ParseAndConvertMarkdownIndicateursToEntitiesTriggered(
        os.path.join(markdown_folder, "indicateurs", referentiel), referentiel
    )

    def publish_trigger_once_this_referentiel_actions_are_stored(
        event: events.ReferentielActionsStored,
    ):
        if event.referentiel == referentiel:
            domain_message_bus.publish_event(indicateurs_trigger)

    if update_actions:
        if update_indicateurs:
            domain_message_bus.subscribe_to_event(
                events.ReferentielActionsStored,
                publish_trigger_once_this_referentiel_actions_are_stored,
            )
        domain_message_bus.publish_event(actions_trigger)
    elif update_indicateurs:
        domain_message_bus.publish_event(indicateurs_trigger)


@cli_update_referentiel.command()
@click.option("--repo-option", default="SUPABASE", required=False)
@click.option(
    "--to-file",
    default="./data/referentiel_repository.sql",
    required=False,
)
@click.option("--actions/--no-actions", is_flag=True, default=True)
@click.option("--indicateurs/--no-indicateurs", is_flag=True, default=True)
@click.option("--markdown-folder", default="../markdown")
@click.option("--referentiel", default=None)
def update_referentiels(
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
    prepare_bus_to_store_referentiels(
        repo_option,
        to_file,
        markdown_folder,
        actions,
        indicateurs,
        referentiel,
    )


# 4.b - To update questions and personnalisations
def prepare_bus_to_update_questions_and_personnalisations(
    repo_option: ReferentielsRepository,
    markdown_folder: str,
):
    """Parse, convert and store referentiels actions and indicateurs given IN/OUT folders.
    Note that we consider that the given markdown folder is organized as follow:
        - f"{markdown_foder}/questions/*md"
        - f"{markdown_foder}/personnalisations/*md"
    """

    domain_message_bus = InMemoryDomainMessageBus()
    config = ReferentielConfig(
        domain_message_bus,
        env_variables=EnvironmentVariables(
            referentiels_repository=repo_option, referentiels_repo_file=None
        ),
    )
    prepare_bus(
        config,
        event_handlers=EVENT_HANDLERS,
    )
    personnalisation_trigger = events.ParseAndConvertMarkdownPersonnalisationsTriggered(
        question_folder_path=os.path.join(markdown_folder, "questions"),
        regle_folder_path=os.path.join(markdown_folder, "personnalisations"),
    )

    domain_message_bus.publish_event(personnalisation_trigger)

    return


@cli_update_questions_and_personnalisations.command()
@click.option("--repo-option", default="SUPABASE", required=False)
@click.option("--markdown-folder", default="../markdown")
def update_questions_and_personnalisations(
    repo_option: ReferentielsRepository,
    markdown_folder: str,
):
    """Parse, convert and store referentiels actions and indicateurs given IN/OUT folders.
    Note that we consider that the given markdown folder is organized as follow:
        - it contains 2 folders named "referentiels" and "indicateurs"
        - within each folder, a folder with the referentiel name
    Hence, markdown to parse will then be:
        - f"{markdown_foder}/referentiels/{referentiel}/*md"
        - f"{markdown_foder}/indicateurs/{referentiel}/*md"
        - f"{markdown_foder}/preuves/{referentiel}/*md"
    """
    prepare_bus_to_update_questions_and_personnalisations(
        repo_option,
        markdown_folder,
    )


if __name__ == "__main__":
    cli()


# Command lines
# --------------
#  python business/referentiel/entrypoints/cli.py update-referentiels
#  python business/referentiel/entrypoints/cli.py update-questions-and-personnalisations
