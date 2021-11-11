from dataclasses import dataclass
from typing import Dict, List, Literal, NewType, Optional

import marshmallow_dataclass

from business.domain.models.action_definition import ReferentielActionId
from business.domain.models.litterals import Referentiel
from business.utils.action_id import ActionId

ClimatPraticId = Literal[
    "strategie",
    "urbanisme",
    "batiments",
    "energie",
    "mobilites",
    "agri_alim",
    "foret_biodiv",
    "conso_resp",
    "dechets",
    "eau",
    "preca_energie",
    "dev_eco",
    "tourisme",
    "orga_interne",
    "forma_sensib",
    "parten_coop",
]

Programme = Literal["cae", "pcaet"]

IndicateurId = NewType("IndicateurId", str)


@dataclass
class Indicateur:
    indicateur_id: IndicateurId
    identifiant: str
    nom: str
    unite: str
    climat_pratic_ids: Optional[List[ClimatPraticId]]
    action_ids: List[ActionId]
    programmes: Optional[List[Programme]]
    description: str
    values_refers_to: Optional[IndicateurId] = None
    source: Optional[str] = None  # TODO : keep, or ?
    obligation_eci: Optional[bool] = None  # TODO : keep, or ?
