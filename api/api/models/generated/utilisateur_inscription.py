from __future__ import annotations

from datetime import date
from typing import List, Literal
from pydantic import BaseModel


class UtilisateurInscription(BaseModel):
    email: str
    nom: str
    prenom: str
    vie_privee_conditions: str
