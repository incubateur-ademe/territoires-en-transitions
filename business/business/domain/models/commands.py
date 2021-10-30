from dataclasses import dataclass

from business.domain.models.litterals import ReferentielId
from business.domain.models.markdown_action_node import MarkdownActionNode


class DomainCommand:
    pass


@dataclass
class ParseMarkdownReferentielFolder(DomainCommand):
    folder_path: str
    referentiel_id: ReferentielId


@dataclass
class ConvertMarkdownReferentielNodeToEntities(DomainCommand):
    referentiel_node: MarkdownActionNode

@dataclass
class ComputeReferentielScoresForEpci(DomainCommand):
    epci_id: str
    referentiel_id: ReferentielId