from typing import Dict, List, Type

from business.domain.models import events, commands
from business.domain.use_cases import *


EVENT_HANDLERS: Dict[Type[events.DomainEvent], List[Type[commands.DomainCommand]]] = {
    # Referentiel
    events.MarkdownReferentielFolderParsed: [
        commands.ConvertMarkdownReferentielNodeToEntities
    ],
    events.MarkdownReferentielNodeConvertedToEntities: [
        commands.StoreReferentielEntities
    ],
    # Notation
    events.ActionStatusUpdatedForEpci: [commands.ComputeReferentielScoresForEpci],
    events.ReferentielScoresForEpciComputed: [commands.StoreScoresForEpci],
}

COMMAND_HANDLERS: Dict[Type[commands.DomainCommand], Type[UseCase]] = {
    # Referentiel
    commands.ParseMarkdownReferentielFolder: ParseMarkdownReferentielFolder,
    commands.ConvertMarkdownReferentielNodeToEntities: ConvertMarkdownReferentielNodeToEntities,
    commands.StoreReferentielEntities: StoreReferentiel,
    # Notation
    commands.ComputeReferentielScoresForEpci: ComputeReferentielScoresForEpci,
    commands.StoreScoresForEpci: StoreScoresForEpci,
}
