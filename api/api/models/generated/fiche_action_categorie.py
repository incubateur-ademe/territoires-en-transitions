from __future__ import annotations

from datetime import date
from dataclasses import dataclass
from typing import List


@dataclass
class FicheActionCategorie:
    epci_id: str
    uid: str
    parent_uid: str
    nom: str
    fiche_actions_uids: List[str]
