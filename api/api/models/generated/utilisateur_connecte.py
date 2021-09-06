from __future__ import annotations

from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel


class UtilisateurConnecte(BaseModel):
    ademe_user_id: str
    access_token: str
    refresh_token: str
    email: str
    nom: str
    prenom: str
