from typing import List

from fastapi import APIRouter, HTTPException
from tortoise.contrib.fastapi import HTTPNotFoundError
from tortoise.exceptions import DoesNotExist

from api.models.pydantic.status import Status
from api.models.tortoise.action_status import ActionStatus_Pydantic, ActionStatus, ActionStatusIn_Pydantic

router = APIRouter(prefix='/v1/action_status')


@router.post("/{epci_id}", response_model=ActionStatus_Pydantic)
async def write_epci_action_status(epci_id: str, action_status: ActionStatusIn_Pydantic):
    if epci_id != action_status.epci_id:
        raise HTTPException(status_code=400, detail="epci_id mismatch")

    query = ActionStatus.filter(epci_id=epci_id, action_id=action_status.action_id)

    if query.exists():
        await query.delete()

    action_status_obj = await ActionStatus.create(**action_status.dict(exclude_unset=True))
    return await ActionStatus_Pydantic.from_tortoise_orm(action_status_obj)


@router.get("/{epci_id}/all", response_model=List[ActionStatus_Pydantic])
async def get_all_epci_actions_status(epci_id: str):
    query = ActionStatus.filter(epci_id=epci_id)
    return await ActionStatus_Pydantic.from_queryset(query)


@router.get(
    "/{epci_id}/{action_id}", response_model=ActionStatus_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def get_action_status(epci_id: str, action_id: str):
    query = ActionStatus.get(epci_id=epci_id, action_id=action_id)
    try:
        return await ActionStatus_Pydantic.from_queryset_single(query)
    except DoesNotExist as error:
        raise HTTPException(status_code=404, detail=f"Action_status {epci_id}/{action_id} not found")


@router.delete("/{epci_id}/{action_id}", response_model=Status,
               responses={404: {"model": HTTPNotFoundError}})
async def delete_action_status(epci_id: str, action_id: str):
    query = ActionStatus.filter(epci_id=epci_id, action_id=action_id)
    deleted_count = await query.delete()
    if not deleted_count:
        raise HTTPException(status_code=404, detail=f"Action_status /{epci_id}/{action_id} not found")
    return Status(message=f"Deleted action_status /{epci_id}/{action_id}")
