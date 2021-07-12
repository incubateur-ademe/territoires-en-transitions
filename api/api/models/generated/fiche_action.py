from __future__ import annotations

from datetime import date
from typing import List
from pydantic import BaseModel


class FicheAction(BaseModel):
    epci_id: str
    uid: str
    custom_id: str
    avancement: str
    referentiel_action_ids: List[str]
    referentiel_indicateur_ids: List[str]
    titre: str
    description: str
    budget: float
    personne_referente: str
    structure_pilote: str
    partenaires: str
    elu_referent: str
    commentaire: str
    date_debut: str
    date_fin: str
    indicateur_personnalise_ids: List[str]
