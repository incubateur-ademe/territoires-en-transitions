from __future__ import annotations

from datetime import date
from dataclasses import dataclass
from typing import List


@dataclass
class UtilisateurConnecte:
    ademe_user_id: str
    access_token: str
    refresh_token: str
    email: str
    nom: str
    prenom: str
