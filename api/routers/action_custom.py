from typing import List

from fastapi import APIRouter, HTTPException
from tortoise.contrib.fastapi import HTTPNotFoundError

from models.pydantic.status import Status
from models.tortoise.action_custom import ActionCustom_Pydantic, ActionCustom, ActionCustomIn_Pydantic

router = APIRouter(prefix='/v1/action_custom')


@router.post("/{epci_id}", response_model=ActionCustom_Pydantic)
async def write_epci_action_custom(epci_id: str, action_custom: ActionCustomIn_Pydantic):
    assert epci_id == action_custom.epci_id
    query = ActionCustom.filter(epci_id=epci_id, mesure_id=action_custom.mesure_id, uid=action_custom.uid)

    if query.exists():
        await query.delete()

    action_custom_obj = await ActionCustom.create(**action_custom.dict(exclude_unset=True))
    return await ActionCustom_Pydantic.from_tortoise_orm(action_custom_obj)


@router.get("/{epci_id}/all", response_model=List[ActionCustom_Pydantic])
async def get_all_epci_actions_custom(epci_id: str):
    query = ActionCustom.filter(epci_id=epci_id)
    return await ActionCustom_Pydantic.from_queryset(query)


@router.get(
    "/{epci_id}/{mesure_id}/{uid}", response_model=ActionCustom_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def get_action_custom(epci_id: str, mesure_id: str, uid: str):
    query = ActionCustom.get(epci_id=epci_id, mesure_id=mesure_id, uid=uid)
    return await ActionCustom_Pydantic.from_queryset_single(query)


@router.delete("/{epci_id}/{mesure_id}/{uid}", response_model=Status,
               responses={404: {"model": HTTPNotFoundError}})
async def delete_action_custom(epci_id: str, mesure_id: str, uid: str):
    query = ActionCustom.filter(epci_id=epci_id, mesure_id=mesure_id, uid=uid)
    deleted_count = await query.delete()
    if not deleted_count:
        raise HTTPException(status_code=404, detail=f"Action_custom {epci_id}/{mesure_id}/{uid} not found")
    return Status(message=f"Deleted action_custom {epci_id}/{mesure_id}/{uid}")
