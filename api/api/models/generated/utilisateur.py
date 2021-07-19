from __future__ import annotations

from datetime import date
from typing import List, Literal
from pydantic import BaseModel


class Utilisateur(BaseModel):
    ademe_user_id: str
    vie_privee: str
