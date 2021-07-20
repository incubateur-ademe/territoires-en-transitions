from __future__ import annotations

from datetime import date
from typing import List, Literal
from pydantic import BaseModel


ActionStatusAvancement = Literal[
    "faite", "programmee", "pas_faite", "non_concernee", "", "en_cours"
]


class ActionStatus(BaseModel):
    action_id: str
    epci_id: str
    avancement: ActionStatusAvancement
