from dataclasses import dataclass
from typing import Dict, List, Optional
from lark import ParseTree
from dataclasses import dataclass
from business.utils.models.personnalisation import (
    ActionPersonnalisationRegles,
)
from business.evaluation.personnalisation.parser import parser
from business.utils.models.actions import ActionId


@dataclass
class ActionPersonnalisationParsedRegles:
    """Parsed regles for an action"""

    desactivation: Optional[ParseTree] = None
    reduction: Optional[ParseTree] = None
    score: Optional[ParseTree] = None


class ReglesParser:
    """Parse all personnalisation formules (to keep them in memory)"""

    def __init__(
        self, personnalisation_regles: List[ActionPersonnalisationRegles]
    ) -> None:
        self._parsed_regles_by_action_id: Dict[
            ActionId, ActionPersonnalisationParsedRegles
        ] = {}
        for personnalisation_regle in personnalisation_regles:
            parsed_trees_by_regle_type = {
                regle.type: parser.parse(regle.formule)
                for regle in personnalisation_regle.regles
            }
            self._parsed_regles_by_action_id[
                personnalisation_regle.action_id
            ] = ActionPersonnalisationParsedRegles(**parsed_trees_by_regle_type)

    @property
    def parsed_regles_by_action_id(
        self,
    ) -> Dict[ActionId, ActionPersonnalisationParsedRegles]:
        return self._parsed_regles_by_action_id
