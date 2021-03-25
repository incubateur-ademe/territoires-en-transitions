from typing import List

from fastapi import APIRouter, HTTPException
from tortoise.contrib.fastapi import HTTPNotFoundError

from models.pydantic.status import Status
from models.tortoise.action_status import ActionStatus_Pydantic, ActionStatus, ActionStatusIn_Pydantic

router = APIRouter(prefix='/action_status/v1')


@router.post("/", response_model=ActionStatus_Pydantic)
async def create_action_status(action_status: ActionStatusIn_Pydantic):
    action_status_obj = await ActionStatus.create(**action_status.dict(exclude_unset=True))
    return await ActionStatus_Pydantic.from_tortoise_orm(action_status_obj)


@router.get("/{epci_id}/all", response_model=List[ActionStatus_Pydantic])
async def get_epci_actions_status(epci_id: str):
    query = ActionStatus.filter(epci_id=epci_id)
    return await ActionStatus_Pydantic.from_queryset(query)


@router.get(
    "/{epci_id}/{action_id}", response_model=ActionStatus_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def get_single_action_status(epci_id: str, action_id: str):
    query = ActionStatus.get(epci_id=epci_id, action_id=action_id)
    return await ActionStatus_Pydantic.from_queryset_single(query)


@router.put(
    "/{epci_id}/{action_id}", response_model=ActionStatus_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def update_action_status(epci_id: str, action_id: str, action_status: ActionStatusIn_Pydantic):
    filter_query = ActionStatus.filter(epci_id=epci_id, action_id=action_id)
    await filter_query.update(**action_status.dict(exclude_unset=True))
    get_query = ActionStatus.get(epci_id=epci_id, action_id=action_id)
    return await ActionStatus_Pydantic.from_queryset_single(get_query)


@router.delete("/{epci_id}/{action_id}", response_model=Status,
               responses={404: {"model": HTTPNotFoundError}})
async def delete_action_status(epci_id: str, action_id: str):
    query = ActionStatus.filter(epci_id=epci_id, action_id=action_id)
    deleted_count = await query.delete()
    if not deleted_count:
        raise HTTPException(status_code=404, detail=f"Action_status /{epci_id}/{action_id} not found")
    return Status(message=f"Deleted action_status /{epci_id}/{action_id}")
