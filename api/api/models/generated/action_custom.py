from __future__ import annotations

from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel


class ActionCustom(BaseModel):
    uid: str
    epci_id: str
    mesure_id: str
    name: str
    description: str
