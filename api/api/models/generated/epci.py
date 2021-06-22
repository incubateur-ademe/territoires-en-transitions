from __future__ import annotations

from datetime import date
from dataclasses import dataclass
from typing import List


@dataclass
class Epci:
    uid: str
    insee: str
    siren: str
    nom: str
