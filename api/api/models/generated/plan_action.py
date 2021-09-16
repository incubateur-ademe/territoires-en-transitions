from __future__ import annotations

from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel


class PlanAction(BaseModel):
    epci_id: str
    uid: str
    nom: str
