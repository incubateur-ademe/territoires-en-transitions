from __future__ import annotations

from datetime import date
from typing import List
from pydantic import BaseModel


class ActionStatus(BaseModel):
    action_id: str
    epci_id: str
    avancement: str
