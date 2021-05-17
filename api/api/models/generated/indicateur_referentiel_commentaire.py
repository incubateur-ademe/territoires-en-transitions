from __future__ import annotations

from datetime import date
from dataclasses import dataclass
from typing import List


@dataclass
class IndicateurReferentielCommentaire:
    epci_id: str
    indicateur_id: str
    value: str
