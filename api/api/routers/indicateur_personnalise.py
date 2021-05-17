from typing import List

from fastapi import APIRouter, HTTPException
from tortoise.contrib.fastapi import HTTPNotFoundError
from tortoise.exceptions import DoesNotExist

from api.models.pydantic.status import Status
from api.models.tortoise.indicateur_personnalise import IndicateurPersonnalise_Pydantic, IndicateurPersonnalise, IndicateurPersonnaliseIn_Pydantic

router = APIRouter(prefix='/v1/indicateur_personnalise')


@router.post("/{epci_id}", response_model=IndicateurPersonnalise_Pydantic)
async def write_epci_indicateur_personnalise(epci_id: str, indicateur_personnalise: IndicateurPersonnaliseIn_Pydantic):
    if epci_id != indicateur_personnalise.epci_id:
        raise HTTPException(status_code=400, detail="epci_id mismatch")

    query = IndicateurPersonnalise.filter(epci_id=epci_id, uid=indicateur_personnalise.uid)

    if query.exists():
        await query.delete()

    indicateur_personnalise_obj = await IndicateurPersonnalise.create(**indicateur_personnalise.dict(exclude_unset=True))
    return await IndicateurPersonnalise_Pydantic.from_tortoise_orm(indicateur_personnalise_obj)


@router.get("/{epci_id}/all", response_model=List[IndicateurPersonnalise_Pydantic])
async def get_all_epci_indicateurs_personnalises(epci_id: str):
    query = IndicateurPersonnalise.filter(epci_id=epci_id)
    return await IndicateurPersonnalise_Pydantic.from_queryset(query)


@router.get(
    "/{epci_id}/{uid}", response_model=IndicateurPersonnalise_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def get_indicateur_personnalise(epci_id: str, uid: str):
    query = IndicateurPersonnalise.get(epci_id=epci_id, uid=uid)
    try:
        return await IndicateurPersonnalise_Pydantic.from_queryset_single(query)
    except DoesNotExist as error:
        raise HTTPException(status_code=404, detail=f"Indicateur_personnalise {epci_id}/{uid} not found")


@router.delete("/{epci_id}/{uid}", response_model=Status,
               responses={404: {"model": HTTPNotFoundError}})
async def delete_indicateur_personnalise(epci_id: str, uid: str):
    query = IndicateurPersonnalise.filter(epci_id=epci_id, uid=uid)
    deleted_count = await query.delete()
    if not deleted_count:
        raise HTTPException(status_code=404, detail=f"Indicateur_personnalise {epci_id}/{uid} not found")
    return Status(message=f"Deleted indicateur_personnalise {epci_id}/{uid}")
