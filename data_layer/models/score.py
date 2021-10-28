# coding: utf-8

from __future__ import annotations

import re  # noqa: F401
from datetime import date, datetime  # noqa: F401
from typing import Any, Dict, List, Optional  # noqa: F401

from pydantic import AnyUrl, BaseModel, EmailStr, validator  # noqa: F401


class Score(BaseModel):
    epci_id: int
    action_id: str
    points: float
    potentiel: float
    referentiel_points: float
    percentage: float
    concernee: bool
    previsionnel: float
    total_taches_count: int
    completed_taches_count: int
    created_at: str

    @validator("action_id")
    def action_id_max_length(cls, value):
        assert len(value) <= 30
        return value


Score.update_forward_refs()
