from __future__ import annotations

from datetime import date
from typing import List, Literal
from pydantic import BaseModel


class Epci(BaseModel):
    uid: str
    insee: str
    siren: str
    nom: str
