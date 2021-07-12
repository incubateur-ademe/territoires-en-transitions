from __future__ import annotations

from datetime import date
from typing import List
from pydantic import BaseModel


class FicheActionCategorie(BaseModel):
    epci_id: str
    uid: str
    parent_uid: str
    nom: str
    fiche_actions_uids: List[str]
