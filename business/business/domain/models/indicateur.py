from dataclasses import dataclass
from typing import List, Literal

from business.domain.models.action_definition import ReferentielActionId
from business.domain.models.litterals import ReferentielId
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


@dataclass
class Indicateur:
    identifiant: str
    nom: str
    referentiel: ReferentielId
    unite: str
    climat_pratic_ids: List[ClimatPraticId]
    action_ids: List[ActionId]
    programmes: List[Programme]
    description: str
