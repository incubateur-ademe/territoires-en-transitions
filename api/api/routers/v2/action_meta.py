from typing import List

from fastapi import APIRouter, HTTPException, Depends
from tortoise.contrib.fastapi import HTTPNotFoundError
from tortoise.exceptions import DoesNotExist

from api.models.tortoise.action_meta import ActionMeta_Pydantic, ActionMeta, ActionMetaIn_Pydantic
from api.models.tortoise.utilisateur_droits import UtilisateurDroits_Pydantic
from api.routers.v2.auth import get_utilisateur_droits_from_header, can_write_epci

router = APIRouter(prefix='/v2/action_meta')


@router.post("/{epci_id}", response_model=ActionMeta_Pydantic)
async def write_epci_action_meta(
        epci_id: str,
        action_meta: ActionMetaIn_Pydantic,
        droits: List[UtilisateurDroits_Pydantic] = Depends(get_utilisateur_droits_from_header)
):
    if epci_id != action_meta.epci_id:
        raise HTTPException(status_code=400, detail="epci_id mismatch")

    if not can_write_epci(epci_id, droits):
        raise HTTPException(status_code=401, detail=f"droits not found for epci {epci_id}")

    query = ActionMeta.filter(
        epci_id=epci_id,
        action_id=action_meta.action_id
    )

    if await query.exists():
        await query.update(latest=False)

    action_meta_obj = await ActionMeta.create(
        **action_meta.dict(exclude_unset=True),
        latest=True,
    )
    return await ActionMeta_Pydantic.from_tortoise_orm(action_meta_obj)


@router.get("/{epci_id}/all", response_model=List[ActionMeta_Pydantic])
async def get_all_epci_actions_meta(epci_id: str):
    query = ActionMeta.filter(epci_id=epci_id, latest=True)
    return await ActionMeta_Pydantic.from_queryset(query)


@router.get(
    "/{epci_id}/{action_id}", response_model=ActionMeta_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def get_action_meta(epci_id: str, action_id: str):
    query = ActionMeta.get(epci_id=epci_id, action_id=action_id, latest=True)
    try:
        return await ActionMeta_Pydantic.from_queryset_single(query)
    except DoesNotExist as error:
        raise HTTPException(status_code=404, detail=f"Action_meta {epci_id}/{action_id} not found")
