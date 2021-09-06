from __future__ import annotations

from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel


class ActionStatus(BaseModel):
    action_id: str
    epci_id: str
    avancement: Literal[
        "faite", "programmee", "pas_faite", "non_concernee", "en_cours", ""
    ]
