from __future__ import annotations

from datetime import date
from dataclasses import dataclass
from typing import List


@dataclass
class IndicateurPersonnaliseValue:
    epci_id: str
    indicateur_id: str
    year: float
    value: str
