from __future__ import annotations

from datetime import date
from dataclasses import dataclass
from typing import List


@dataclass
class FicheAction:
    epci_id: str
    uid: str
    custom_id: str
    avancement: str
    referentiel_action_ids: List[str]
    referentiel_indicateur_ids: List[str]
    titre: str
    description: str
    budget: float
    porteur: str
    commentaire: str
    date_debut: str
    date_fin: str
    indicateur_personnalise_ids: List[str]
