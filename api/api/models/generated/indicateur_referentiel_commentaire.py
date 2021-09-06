from __future__ import annotations

from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel


class IndicateurReferentielCommentaire(BaseModel):
    epci_id: str
    indicateur_id: str
    value: str
