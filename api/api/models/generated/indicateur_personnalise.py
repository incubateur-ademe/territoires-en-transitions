from __future__ import annotations

from datetime import date
from dataclasses import dataclass
from typing import List


@dataclass
class IndicateurPersonnalise:
    epci_id: str
    uid: str
    custom_id: str
    nom: str
    description: str
    unite: str
