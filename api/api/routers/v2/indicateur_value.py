from typing import List

from fastapi import APIRouter, HTTPException, Depends
from tortoise.contrib.fastapi import HTTPNotFoundError
from tortoise.exceptions import DoesNotExist

from api.models.tortoise.indicateur_value import IndicateurValue_Pydantic, IndicateurValue, IndicateurValueIn_Pydantic
from api.models.tortoise.utilisateur_droits import UtilisateurDroits_Pydantic
from api.routers.v2.auth import get_utilisateur_droits_from_header, can_write_epci

router = APIRouter(prefix='/v2/indicateur_value')


@router.post("/{epci_id}", response_model=IndicateurValue_Pydantic)
async def write_epci_indicateur_value(
        epci_id: str,
        indicateur_value: IndicateurValueIn_Pydantic,
        droits: List[UtilisateurDroits_Pydantic] = Depends(get_utilisateur_droits_from_header)
):
    if epci_id != indicateur_value.epci_id:
        raise HTTPException(status_code=400, detail="epci_id mismatch")

    if not can_write_epci(epci_id, droits):
        raise HTTPException(status_code=401, detail=f"droits not found for epci {epci_id}")

    query = IndicateurValue.filter(
        epci_id=epci_id,
        indicateur_id=indicateur_value.indicateur_id,
        year=indicateur_value.year
    )
    if await query.exists():
        await query.update(latest=False)

    indicateur_value_obj = await IndicateurValue.create(
        **indicateur_value.dict(exclude_unset=True),
        latest=True,
    )
    return await IndicateurValue_Pydantic.from_tortoise_orm(indicateur_value_obj)


@router.get("/{epci_id}/all", response_model=List[IndicateurValue_Pydantic])
async def get_all_epci_indicateurs_values(epci_id: str):
    query = IndicateurValue.filter(epci_id=epci_id, latest=True)
    return await IndicateurValue_Pydantic.from_queryset(query)


@router.get("/{epci_id}/{indicateur_id}", response_model=List[IndicateurValue_Pydantic])
async def get_indicateur_yearly_values(epci_id: str, indicateur_id: str):
    filter_query = IndicateurValue.filter(epci_id=epci_id, indicateur_id=indicateur_id, latest=True)
    return await IndicateurValue_Pydantic.from_queryset(filter_query)


@router.get(
    "/{epci_id}/{indicateur_id}/{year}", response_model=IndicateurValue_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def get_indicateur_value(epci_id: str, indicateur_id: str, year: int):
    query = IndicateurValue.get(epci_id=epci_id, indicateur_id=indicateur_id, year=year, latest=True)
    try:
        return await IndicateurValue_Pydantic.from_queryset_single(query)
    except DoesNotExist as error:
        raise HTTPException(status_code=404, detail=f"Indicateur_value {epci_id}/{indicateur_id}/{year} not found")
