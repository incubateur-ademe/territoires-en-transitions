from __future__ import annotations

from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel


class UtilisateurDroits(BaseModel):
    ademe_user_id: str
    epci_id: str
    ecriture: bool
