from __future__ import annotations

from datetime import date
from dataclasses import dataclass
from typing import List


@dataclass
class ActionReferentiel:
    id: str
    id_nomenclature: str
    nom: str
    description: str
    actions: List[ActionReferentiel]
