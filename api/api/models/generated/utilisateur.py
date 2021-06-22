from __future__ import annotations

from datetime import date
from dataclasses import dataclass
from typing import List


@dataclass
class Utilisateur:
    ademe_user_id: str
    vie_privee: str
