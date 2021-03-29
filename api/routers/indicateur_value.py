from typing import List

from fastapi import APIRouter, HTTPException
from tortoise.contrib.fastapi import HTTPNotFoundError

from models.pydantic.status import Status
from models.tortoise.indicateur_value import IndicateurValue_Pydantic, IndicateurValue, IndicateurValueIn_Pydantic

router = APIRouter(prefix='/v1/indicateur_value')


@router.post("/", response_model=IndicateurValue_Pydantic)
async def write_indicateur_value(indicateur_value: IndicateurValueIn_Pydantic):
    indicateur_value_obj = await IndicateurValue.create(**indicateur_value.dict(exclude_unset=True))
    return await IndicateurValue_Pydantic.from_tortoise_orm(indicateur_value_obj)


@router.post("/{epci_id}", response_model=IndicateurValue_Pydantic)
async def write_epci_indicateur_value(epci_id: str, indicateur_value: IndicateurValueIn_Pydantic):
    indicateur_value_obj = await IndicateurValue.create(**indicateur_value.dict(exclude_unset=True))
    assert epci_id == indicateur_value.epci_id
    return await IndicateurValue_Pydantic.from_tortoise_orm(indicateur_value_obj)


@router.get("/{epci_id}/all", response_model=List[IndicateurValue_Pydantic])
async def get_all_epci_indicateurs_values(epci_id: str):
    query = IndicateurValue.filter(epci_id=epci_id)
    return await IndicateurValue_Pydantic.from_queryset(query)


@router.get("/{epci_id}/{indicateur_id}", response_model=List[IndicateurValue_Pydantic])
async def get_indicateur_yearly_values(epci_id: str, indicateur_id: str):
    filter_query = IndicateurValue.filter(epci_id=epci_id, indicateur_id=indicateur_id)
    return await IndicateurValue_Pydantic.from_queryset(filter_query)


@router.get(
    "/{epci_id}/{indicateur_id}/{year}", response_model=IndicateurValue_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def get_indicateur_value(epci_id: str, indicateur_id: str, year: int):
    query = IndicateurValue.get(epci_id=epci_id, indicateur_id=indicateur_id, year=year)
    return await IndicateurValue_Pydantic.from_queryset_single(query)


@router.put(
    "/{epci_id}/{indicateur_id}/{year}", response_model=IndicateurValue_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def update_indicateur_value(epci_id: str, indicateur_id: str, year: int,
                                  indicateur_value: IndicateurValueIn_Pydantic):
    filter_query = IndicateurValue.filter(epci_id=epci_id, indicateur_id=indicateur_id, year=year)
    await filter_query.update(**indicateur_value.dict(exclude_unset=True))
    get_query = IndicateurValue.get(epci_id=epci_id, indicateur_id=indicateur_id, year=year)
    return await IndicateurValue_Pydantic.from_queryset_single(get_query)


@router.delete("/{epci_id}/{indicateur_id}/{year}", response_model=Status,
               responses={404: {"model": HTTPNotFoundError}})
async def delete_indicateur_value(epci_id: str, indicateur_id: str, year: int):
    query = IndicateurValue.filter(epci_id=epci_id, indicateur_id=indicateur_id, year=year)
    deleted_count = await query.delete()
    if not deleted_count:
        raise HTTPException(status_code=404, detail=f"Indicateur_value {epci_id}/{indicateur_id}/{year} not found")
    return Status(message=f"Deleted indicateur_value {epci_id}/{indicateur_id}/{year}")
