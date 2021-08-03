from typing import List

from fastapi import APIRouter
from fastapi import Depends, HTTPException
from tortoise.contrib.fastapi import HTTPNotFoundError
from tortoise.exceptions import DoesNotExist

from api.models.pydantic.utilisateur_connecte import UtilisateurConnecte
from api.models.tortoise.epci import Epci_Pydantic, Epci, EpciIn_Pydantic
from api.models.tortoise.utilisateur_droits import (
    UtilisateurDroits_Pydantic,
    UtilisateurDroits,
)
from api.routers.v2.auth import (
    can_write_epci,
    get_user_from_header,
    get_utilisateur_droits_from_header,
)

router = APIRouter(prefix="/v2/epci")


@router.post("", response_model=Epci_Pydantic)
async def write_epci(
    epci: EpciIn_Pydantic,
    utilisateur: UtilisateurConnecte = Depends(get_user_from_header),
    droits: List[UtilisateurDroits_Pydantic] = Depends(
        get_utilisateur_droits_from_header
    ),
):
    """
    For an existing Epci corresponding `utilisateur droits` are needed.
    Otherwise `utilisateur droits` are created for the token bearer.
    """
    query = Epci.filter(uid=epci.uid)

    if await query.exists():
        if not can_write_epci(epci.uid, droits):
            raise HTTPException(
                status_code=401, detail=f"droits not found for epci {epci.uid}"
            )
        await query.update(latest=False)

    else:
        await UtilisateurDroits.create(
            epci_id=epci.uid,
            ademe_user_id=utilisateur.ademe_user_id,
            ecriture=True,
            latest=True,
        )

    epci_obj = await Epci.create(
        **epci.dict(exclude_unset=True),
        latest=True,
    )
    return await Epci_Pydantic.from_tortoise_orm(epci_obj)


@router.get("/all", response_model=List[Epci_Pydantic])
async def get_all_epci():
    query = Epci.filter(latest=True)

    return await Epci_Pydantic.from_queryset(query)


@router.get(
    "/{uid}",
    response_model=Epci_Pydantic,
    responses={404: {"model": HTTPNotFoundError}},
)
async def get_epci(uid: str):
    query = Epci.get(uid=uid, latest=True)

    try:
        return await Epci_Pydantic.from_queryset_single(query)
    except DoesNotExist as error:
        raise HTTPException(status_code=404, detail=f"epci {uid} not found")
