from typing import List

from fastapi import APIRouter, HTTPException, Depends
from tortoise.contrib.fastapi import HTTPNotFoundError
from tortoise.exceptions import DoesNotExist

from api.models.tortoise.indicateur_referentiel_commentaire import IndicateurReferentielCommentaire_Pydantic, \
    IndicateurReferentielCommentaire, \
    IndicateurReferentielCommentaireIn_Pydantic
from api.models.tortoise.utilisateur_droits import UtilisateurDroits_Pydantic
from api.routers.v2.auth import get_utilisateur_droits_from_header, can_write_epci

router = APIRouter(prefix='/v2/indicateur_referentiel_commentaire')


@router.post("/{epci_id}", response_model=IndicateurReferentielCommentaire_Pydantic)
async def write_epci_indicateur_referentiel_commentaire(
        epci_id: str,
        indicateur_referentiel_commentaire: IndicateurReferentielCommentaireIn_Pydantic,
        droits: List[UtilisateurDroits_Pydantic] = Depends(get_utilisateur_droits_from_header)
):
    if epci_id != indicateur_referentiel_commentaire.epci_id:
        raise HTTPException(status_code=400, detail="epci_id mismatch")

    if not can_write_epci(epci_id, droits):
        raise HTTPException(status_code=401, detail=f"droits not found for epci {epci_id}")

    query = IndicateurReferentielCommentaire.filter(
        epci_id=epci_id,
        indicateur_id=indicateur_referentiel_commentaire.indicateur_id
    )

    if await query.exists():
        await query.update(latest=False)

    indicateur_referentiel_commentaire_obj = await IndicateurReferentielCommentaire.create(
        **indicateur_referentiel_commentaire.dict(exclude_unset=True),
        latest=True,
    )
    return await IndicateurReferentielCommentaire_Pydantic.from_tortoise_orm(indicateur_referentiel_commentaire_obj)


@router.get("/{epci_id}/all", response_model=List[IndicateurReferentielCommentaire_Pydantic])
async def get_all_epci_indicateur_referentiel_commentaire(epci_id: str):
    query = IndicateurReferentielCommentaire.filter(epci_id=epci_id, latest=True)
    return await IndicateurReferentielCommentaire_Pydantic.from_queryset(query)


@router.get(
    "/{epci_id}/{indicateur_id}",
    response_model=IndicateurReferentielCommentaire_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def get_indicateur_referentiel_commentaire(epci_id: str, indicateur_id: str):
    query = IndicateurReferentielCommentaire.get(epci_id=epci_id, indicateur_id=indicateur_id, latest=True)
    try:
        return await IndicateurReferentielCommentaire_Pydantic.from_queryset_single(query)
    except DoesNotExist as error:
        raise HTTPException(status_code=404,
                            detail=f"indicateur_referentiel_commentaire {epci_id}/{indicateur_id} not found")
