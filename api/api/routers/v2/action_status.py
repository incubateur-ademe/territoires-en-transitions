from typing import List

from fastapi import APIRouter, Depends, HTTPException
from tortoise.contrib.fastapi import HTTPNotFoundError
from tortoise.exceptions import DoesNotExist

from api.models.tortoise.action_status import (
    ActionStatus,
    ActionStatusIn_Pydantic,
    ActionStatus_Pydantic,
)
from api.models.tortoise.utilisateur_droits import UtilisateurDroits_Pydantic
from api.routers.v2.auth import can_write_epci, get_utilisateur_droits_from_header

router = APIRouter(prefix="/v2/action_status")


@router.post("/{epci_id}", response_model=ActionStatus_Pydantic)
async def write_epci_action_status(
    epci_id: str,
    action_status: ActionStatusIn_Pydantic,
    droits: List[UtilisateurDroits_Pydantic] = Depends(
        get_utilisateur_droits_from_header
    ),
):
    if epci_id != action_status.epci_id:
        raise HTTPException(status_code=400, detail="epci_id mismatch")

    if not can_write_epci(epci_id, droits):
        raise HTTPException(
            status_code=401, detail=f"droits not found for epci {epci_id}"
        )

    query = ActionStatus.filter(epci_id=epci_id, action_id=action_status.action_id)

    if await query.exists():
        await query.update(latest=False)

    action_status_obj = await ActionStatus.create(
        **action_status.dict(exclude_unset=True),
        latest=True,
    )
    return await ActionStatus_Pydantic.from_tortoise_orm(action_status_obj)


@router.get("/{epci_id}/all", response_model=List[ActionStatus_Pydantic])
async def get_all_epci_actions_status(epci_id: str):
    query = ActionStatus.filter(epci_id=epci_id, latest=True)
    return await ActionStatus_Pydantic.from_queryset(query)


@router.get(
    "/{epci_id}/{action_id}",
    response_model=ActionStatus_Pydantic,
    responses={404: {"model": HTTPNotFoundError}},
)
async def get_action_status(epci_id: str, action_id: str):
    query = ActionStatus.get(epci_id=epci_id, action_id=action_id, latest=True)
    try:
        return await ActionStatus_Pydantic.from_queryset_single(query)
    except DoesNotExist as error:
        raise HTTPException(
            status_code=404, detail=f"Action_status {epci_id}/{action_id} not found"
        )
