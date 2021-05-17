from __future__ import annotations

from datetime import date
from dataclasses import dataclass
from typing import List


@dataclass
class IndicateurReferentiel:
    id: str
    action_ids: List[str]
    nom: str
    description: str
    thematique_id: str
    unite: str
