from __future__ import annotations

from datetime import date
from dataclasses import dataclass
from typing import List


@dataclass
class UtilisateurInscription:
    email: str
    nom: str
    prenom: str
    vie_privee_conditions: str
