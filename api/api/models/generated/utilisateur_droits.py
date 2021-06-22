from __future__ import annotations

from datetime import date
from dataclasses import dataclass
from typing import List


@dataclass
class UtilisateurDroits:
    ademe_user_id: str
    epci_id: str
    ecriture: bool
