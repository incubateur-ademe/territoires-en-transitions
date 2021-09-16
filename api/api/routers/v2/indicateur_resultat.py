from typing import List

from fastapi import APIRouter, Depends
from tortoise.contrib.fastapi import HTTPNotFoundError
from tortoise.contrib.pydantic import pydantic_model_creator
from api.models.tortoise.any_indicateur_values import (
    IndicateurResultat,
)
from api.models.tortoise.utilisateur_droits import UtilisateurDroits_Pydantic
from api.routers.v2.auth import get_utilisateur_droits_from_header
from api.utils.get_pydantic_in_model_creator import get_pydantic_in_model_creator
from api.utils.indicateur_value_generic_api import IndicateurValueGenericAPI

router = APIRouter(prefix="/v2/indicateur_resultat")

IndicateurResultatIn_Pydantic = get_pydantic_in_model_creator(IndicateurResultat)
IndicateurResultatOut_Pydantic = pydantic_model_creator(IndicateurResultat)
indicateur_value_generic_api = IndicateurValueGenericAPI(
    IndicateurResultat, IndicateurResultatIn_Pydantic, IndicateurResultatOut_Pydantic
)


@router.post("/{epci_id}", response_model=IndicateurResultatOut_Pydantic)
async def post_epci_indicateur_resultat(
    epci_id: str,
    indicateur_value: IndicateurResultatIn_Pydantic,
    droits: List[UtilisateurDroits_Pydantic] = Depends(
        get_utilisateur_droits_from_header
    ),
):
    return await indicateur_value_generic_api.post_epci_indicateur_value(
        epci_id, indicateur_value, droits
    )


@router.get("/{epci_id}/all", response_model=List[IndicateurResultatOut_Pydantic])
async def get_all_epci_indicateurs_values(epci_id: str):
    return await indicateur_value_generic_api.get_all_epci_indicateurs_values(epci_id)


@router.get(
    "/{epci_id}/{indicateur_id}", response_model=List[IndicateurResultatOut_Pydantic]
)
async def get_indicateur_yearly_values(epci_id: str, indicateur_id: str):
    return await indicateur_value_generic_api.get_indicateur_yearly_values(
        epci_id, indicateur_id
    )


@router.get(
    "/{epci_id}/{indicateur_id}/{year}",
    response_model=IndicateurResultatOut_Pydantic,
    responses={404: {"model": HTTPNotFoundError}},
)
async def get_indicateur_value(epci_id: str, indicateur_id: str, year: int):
    return await indicateur_value_generic_api.get_indicateur_value(
        epci_id, indicateur_id, year
    )
