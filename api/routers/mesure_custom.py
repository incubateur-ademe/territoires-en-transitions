from typing import List

from fastapi import APIRouter, HTTPException
from tortoise.contrib.fastapi import HTTPNotFoundError

from models.pydantic.status import Status
from models.tortoise.mesure_custom import MesureCustom_Pydantic, MesureCustom, MesureCustomIn_Pydantic

router = APIRouter(prefix='/v1/mesure_custom')


@router.post("/", response_model=MesureCustom_Pydantic)
async def write_mesure_custom(mesure_custom: MesureCustomIn_Pydantic):
    mesure_custom_obj = await MesureCustom.create(**mesure_custom.dict(exclude_unset=True))
    return await MesureCustom_Pydantic.from_tortoise_orm(mesure_custom_obj)


@router.post("/{epci_id}", response_model=MesureCustom_Pydantic)
async def write_epci_mesure_custom(epci_id: str, mesure_custom: MesureCustomIn_Pydantic):
    mesure_custom_obj = await MesureCustom.create(**mesure_custom.dict(exclude_unset=True))
    assert epci_id == mesure_custom_obj.epci_id
    return await MesureCustom_Pydantic.from_tortoise_orm(mesure_custom_obj)


@router.get("/{epci_id}/all", response_model=List[MesureCustom_Pydantic])
async def get_all_epci_mesures_custom(epci_id: str):
    query = MesureCustom.filter(epci_id=epci_id)
    return await MesureCustom_Pydantic.from_queryset(query)


@router.get(
    "/{epci_id}/{uid}", response_model=MesureCustom_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def get_mesure_custom(epci_id: str, uid: str):
    query = MesureCustom.get(epci_id=epci_id, uid=uid)
    return await MesureCustom_Pydantic.from_queryset_single(query)


@router.put(
    "/{epci_id}/{uid}", response_model=MesureCustom_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def update_mesure_custom(epci_id: str, uid: str, mesure_custom: MesureCustomIn_Pydantic):
    filter_query = MesureCustom.filter(epci_id=epci_id, uid=uid)
    await filter_query.update(**mesure_custom.dict(exclude_unset=True))
    get_query = MesureCustom.get(epci_id=epci_id, uid=uid)
    return await MesureCustom_Pydantic.from_queryset_single(get_query)


@router.delete("/{epci_id}/{uid}", response_model=Status,
               responses={404: {"model": HTTPNotFoundError}})
async def delete_mesure_custom(epci_id: str, uid: str):
    query = MesureCustom.filter(epci_id=epci_id, uid=uid)
    deleted_count = await query.delete()
    if not deleted_count:
        raise HTTPException(status_code=404, detail=f"Mesure_custom {epci_id}/{uid} not found")
    return Status(message=f"Deleted mesure_custom {epci_id}/{uid}")
