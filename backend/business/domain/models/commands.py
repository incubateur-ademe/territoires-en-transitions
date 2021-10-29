from dataclasses import dataclass

from backend.domain.models.litterals import ReferentielId
from backend.domain.models.markdown_action_node import MarkdownActionNode


class DomainCommand:
    pass


@dataclass
class ParseMarkdownReferentielFolder(DomainCommand):
    folder_path: str
    referentiel_id: ReferentielId


@dataclass
class ConvertMarkdownReferentielNodeToEntities(DomainCommand):
    referentiel_node: MarkdownActionNode
