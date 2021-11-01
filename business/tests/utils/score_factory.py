from typing import Tuple

from business.utils.action_id import ActionId, retrieve_referentiel_id
from business.domain.models.action_score import ActionScore


def make_action_score(
    action_id: str,
    points: float = 100,
    potentiel: float = 100,
    previsionnel: float = 100,
    referentiel_points: float = 100,
    concernee: bool = True,
    completude_ratio: Tuple[int, int] = (0, 0),
):
    return ActionScore(
        referentiel_id=retrieve_referentiel_id(ActionId(action_id)),
        action_id=ActionId(action_id),
        points=points,
        potentiel=potentiel,
        previsionnel=previsionnel,
        referentiel_points=referentiel_points,
        concernee=concernee,
        completude_ratio=completude_ratio,
    )
