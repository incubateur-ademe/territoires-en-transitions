from __future__ import annotations

from datetime import date
from typing import List
from pydantic import BaseModel


class ActionMeta(BaseModel):
    action_id: str
    epci_id: str
    meta: dict
