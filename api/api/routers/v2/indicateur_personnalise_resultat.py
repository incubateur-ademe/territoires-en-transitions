from typing import List

from fastapi import APIRouter, Depends
from tortoise.contrib.fastapi import HTTPNotFoundError
from tortoise.contrib.pydantic import pydantic_model_creator
from api.models.tortoise.any_indicateur_values import (
    IndicateurPersonnaliseResultat,
)
from api.models.tortoise.utilisateur_droits import UtilisateurDroits_Pydantic
from api.routers.v2.auth import get_utilisateur_droits_from_header
from api.utils.get_pydantic_in_model_creator import get_pydantic_in_model_creator
from api.utils.indicateur_value_generic_api import IndicateurValueGenericAPI


router = APIRouter(prefix="/v2/indicateur_personnalise_resultat")

IndicateurPersonnaliseResultatIn_Pydantic = get_pydantic_in_model_creator(
    IndicateurPersonnaliseResultat
)
IndicateurPersonnaliseResultatOut_Pydantic = pydantic_model_creator(
    IndicateurPersonnaliseResultat
)
indicateur_value_generic_api = IndicateurValueGenericAPI(
    IndicateurPersonnaliseResultat,
    IndicateurPersonnaliseResultatIn_Pydantic,
    IndicateurPersonnaliseResultatOut_Pydantic,
)


@router.post("/{epci_id}", response_model=IndicateurPersonnaliseResultatOut_Pydantic)
async def post_epci_indicateur_value(
    epci_id: str,
    indicateur_value: IndicateurPersonnaliseResultatIn_Pydantic,
    droits: List[UtilisateurDroits_Pydantic] = Depends(
        get_utilisateur_droits_from_header
    ),
):
    return await indicateur_value_generic_api.post_epci_indicateur_value(
        epci_id, indicateur_value, droits
    )


@router.get(
    "/{epci_id}/all", response_model=List[IndicateurPersonnaliseResultatOut_Pydantic]
)
async def get_all_epci_indicateurs_values(epci_id: str):
    return await indicateur_value_generic_api.get_all_epci_indicateurs_values(epci_id)


@router.get(
    "/{epci_id}/{indicateur_id}",
    response_model=List[IndicateurPersonnaliseResultatOut_Pydantic],
)
async def get_indicateur_yearly_values(epci_id: str, indicateur_id: str):
    return await indicateur_value_generic_api.get_indicateur_yearly_values(
        epci_id, indicateur_id
    )


@router.get(
    "/{epci_id}/{indicateur_id}/{year}",
    response_model=IndicateurPersonnaliseResultatOut_Pydantic,
    responses={404: {"model": HTTPNotFoundError}},
)
async def get_indicateur_value(epci_id: str, indicateur_id: str, year: int):
    return await indicateur_value_generic_api.get_indicateur_value(
        epci_id, indicateur_id, year
    )
