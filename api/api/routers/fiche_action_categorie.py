from typing import List

from fastapi import APIRouter, HTTPException
from tortoise.contrib.fastapi import HTTPNotFoundError
from tortoise.exceptions import DoesNotExist

from api.models.pydantic.status import Status
from api.models.tortoise.fiche_action_categorie import FicheActionCategorie_Pydantic, FicheActionCategorie, \
    FicheActionCategorieIn_Pydantic

router = APIRouter(prefix='/v1/fiche_action_categorie')


@router.post("/{epci_id}", response_model=FicheActionCategorie_Pydantic)
async def write_epci_fiche_action_categorie(epci_id: str, fiche_action_categorie: FicheActionCategorieIn_Pydantic):
    if epci_id != fiche_action_categorie.epci_id:
        raise HTTPException(status_code=400, detail="epci_id mismatch")

    query = FicheActionCategorie.filter(epci_id=epci_id, uid=fiche_action_categorie.uid)

    if query.exists():
        await query.delete()

    fiche_action_categorie_obj = await FicheActionCategorie.create(**fiche_action_categorie.dict(exclude_unset=True))
    return await FicheActionCategorie_Pydantic.from_tortoise_orm(fiche_action_categorie_obj)


@router.get("/{epci_id}/all", response_model=List[FicheActionCategorie_Pydantic])
async def get_all_epci_action_categories_status(epci_id: str):
    query = FicheActionCategorie.filter(epci_id=epci_id)
    return await FicheActionCategorie_Pydantic.from_queryset(query)


@router.get(
    "/{epci_id}/{uid}", response_model=FicheActionCategorie_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def get_fiche_action_categorie(epci_id: str, uid: str):
    query = FicheActionCategorie.get(epci_id=epci_id, uid=uid)
    try:
        return await FicheActionCategorie_Pydantic.from_queryset_single(query)
    except DoesNotExist as error:
        raise HTTPException(status_code=404, detail=f"fiche_action_categorie {epci_id}/{uid} not found")


@router.delete(
    "/{epci_id}/{uid}", response_model=Status,
    responses={404: {"model": HTTPNotFoundError}}
)
async def delete_fiche_action_categorie(epci_id: str, uid: str):
    query = FicheActionCategorie.filter(epci_id=epci_id, uid=uid)
    deleted_count = await query.delete()
    if not deleted_count:
        raise HTTPException(status_code=404, detail=f"fiche_action_categorie /{epci_id}/{uid} not found")
    return Status(message=f"Deleted fiche_action_categorie /{epci_id}/{uid}")
