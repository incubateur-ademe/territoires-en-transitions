from typing import List

from fastapi import APIRouter, HTTPException
from tortoise.contrib.fastapi import HTTPNotFoundError
from tortoise.exceptions import DoesNotExist

from api.models.pydantic.status import Status
from api.models.tortoise.indicateur_personnalise_value import IndicateurPersonnaliseValue_Pydantic, \
    IndicateurPersonnaliseValue, IndicateurPersonnaliseValueIn_Pydantic

router = APIRouter(prefix='/v1/indicateur_personnalise_value')


@router.post("/{epci_id}", response_model=IndicateurPersonnaliseValue_Pydantic)
async def write_epci_indicateur_personnalise_value(epci_id: str,
                                                   indicateur_personnalise_value: IndicateurPersonnaliseValueIn_Pydantic):
    if epci_id != indicateur_personnalise_value.epci_id:
        raise HTTPException(status_code=400, detail="epci_id mismatch")

    query = IndicateurPersonnaliseValue.filter(epci_id=epci_id,
                                               indicateur_id=indicateur_personnalise_value.indicateur_id,
                                               year=indicateur_personnalise_value.year)
    if query.exists():
        await query.delete()

    indicateur_personnalise_value_obj = await IndicateurPersonnaliseValue.create(
        **indicateur_personnalise_value.dict(exclude_unset=True))
    return await IndicateurPersonnaliseValue_Pydantic.from_tortoise_orm(indicateur_personnalise_value_obj)


@router.get("/{epci_id}/all", response_model=List[IndicateurPersonnaliseValue_Pydantic])
async def get_all_epci_indicateurs_values(epci_id: str):
    query = IndicateurPersonnaliseValue.filter(epci_id=epci_id)
    return await IndicateurPersonnaliseValue_Pydantic.from_queryset(query)


@router.get("/{epci_id}/{indicateur_id}", response_model=List[IndicateurPersonnaliseValue_Pydantic])
async def get_indicateur_personnalise_yearly_values(epci_id: str, indicateur_id: str):
    filter_query = IndicateurPersonnaliseValue.filter(epci_id=epci_id, indicateur_id=indicateur_id)
    return await IndicateurPersonnaliseValue_Pydantic.from_queryset(filter_query)


@router.get(
    "/{epci_id}/{indicateur_id}/{year}", response_model=IndicateurPersonnaliseValue_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def get_indicateur_personnalise_value(epci_id: str, indicateur_id: str, year: int):
    query = IndicateurPersonnaliseValue.get(epci_id=epci_id, indicateur_id=indicateur_id, year=year)
    try:
        return await IndicateurPersonnaliseValue_Pydantic.from_queryset_single(query)
    except DoesNotExist as error:
        raise HTTPException(status_code=404,
                            detail=f"indicateur_personnalise_value {epci_id}/{indicateur_id}/{year} not found")


@router.delete("/{epci_id}/{indicateur_id}/{year}", response_model=Status,
               responses={404: {"model": HTTPNotFoundError}})
async def delete_indicateur_personnalise_value(epci_id: str, indicateur_id: str, year: int):
    query = IndicateurPersonnaliseValue.filter(epci_id=epci_id, indicateur_id=indicateur_id, year=year)
    deleted_count = await query.delete()
    if not deleted_count:
        raise HTTPException(status_code=404,
                            detail=f"indicateur_personnalise_value {epci_id}/{indicateur_id}/{year} not found")
    return Status(message=f"Deleted indicateur_personnalise_value {epci_id}/{indicateur_id}/{year}")
