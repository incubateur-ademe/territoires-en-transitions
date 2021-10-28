# coding: utf-8

from __future__ import annotations

import re  # noqa: F401
from datetime import date, datetime  # noqa: F401
from typing import Any, Dict, List, Optional  # noqa: F401

from pydantic import AnyUrl, BaseModel, EmailStr, validator  # noqa: F401


class ClientEpci(BaseModel):
    siren: str
    nom: str

    @validator("nom")
    def nom_max_length(cls, value):
        assert len(value) <= 300
        return value


ClientEpci.update_forward_refs()
