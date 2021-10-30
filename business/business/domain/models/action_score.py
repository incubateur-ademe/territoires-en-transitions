from typing import Tuple

from dataclasses import dataclass


@dataclass
class ActionScore: # TODO rename ActionScore
    action_id: str
    points: float
    potentiel: float
    previsionnel: float
    referentiel_points: float
    concernee: bool
    completude_ratio: Tuple[int, int]
