from __future__ import annotations

from datetime import date
from typing import List, Literal
from pydantic import BaseModel


class IndicateurPersonnalise(BaseModel):
    epci_id: str
    uid: str
    custom_id: str
    nom: str
    description: str
    unite: str
