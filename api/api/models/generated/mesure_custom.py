from __future__ import annotations

from datetime import date
from typing import List
from pydantic import BaseModel


class MesureCustom(BaseModel):
    uid: str
    epci_id: str
    climat_pratic_thematic_id: str
    name: str
