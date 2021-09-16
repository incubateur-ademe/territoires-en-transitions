from __future__ import annotations

from dataclasses import dataclass
from typing import List


@dataclass()
class ActionReferentiel:
    id: str
    id_nomenclature: str
    nom: str
    description: str
    thematique_id: str
    points: float
    actions: List[ActionReferentiel]
