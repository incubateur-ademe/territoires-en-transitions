from __future__ import annotations

from datetime import date
from dataclasses import dataclass
from typing import List


@dataclass
class MesureCustom:
    uid: str
    epci_id: str
    climat_pratic_thematic_id: str
    name: str
