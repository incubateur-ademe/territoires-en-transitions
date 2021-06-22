from typing import List

from fastapi import APIRouter, HTTPException
from tortoise.contrib.fastapi import HTTPNotFoundError
from tortoise.exceptions import DoesNotExist

from api.models.pydantic.status import Status
from api.models.tortoise.indicateur_referentiel_commentaire import IndicateurReferentielCommentaire_Pydantic, \
    IndicateurReferentielCommentaire, \
    IndicateurReferentielCommentaireIn_Pydantic

router = APIRouter(prefix='/v1/indicateur_referentiel_commentaire')


@router.post("/{epci_id}", response_model=IndicateurReferentielCommentaire_Pydantic)
async def write_epci_indicateur_referentiel_commentaire(epci_id: str,
                                                        indicateur_referentiel_commentaire: IndicateurReferentielCommentaireIn_Pydantic):
    if epci_id != indicateur_referentiel_commentaire.epci_id:
        raise HTTPException(status_code=400, detail="epci_id mismatch")

    query = IndicateurReferentielCommentaire.filter(epci_id=epci_id, indicateur_id=indicateur_referentiel_commentaire.indicateur_id)

    if query.exists():
        await query.delete()

    indicateur_referentiel_commentaire_obj = await IndicateurReferentielCommentaire.create(
        **indicateur_referentiel_commentaire.dict(exclude_unset=True))
    return await IndicateurReferentielCommentaire_Pydantic.from_tortoise_orm(indicateur_referentiel_commentaire_obj)


@router.get("/{epci_id}/all", response_model=List[IndicateurReferentielCommentaire_Pydantic])
async def get_all_epci_indicateur_referentiel_commentaire(epci_id: str):
    query = IndicateurReferentielCommentaire.filter(epci_id=epci_id)
    return await IndicateurReferentielCommentaire_Pydantic.from_queryset(query)


@router.get(
    "/{epci_id}/{indicateur_id}", response_model=IndicateurReferentielCommentaire_Pydantic,
    responses={404: {"model": HTTPNotFoundError}}
)
async def get_indicateur_referentiel_commentaire(epci_id: str, indicateur_id: str):
    query = IndicateurReferentielCommentaire.get(epci_id=epci_id, indicateur_id=indicateur_id)
    try:
        return await IndicateurReferentielCommentaire_Pydantic.from_queryset_single(query)
    except DoesNotExist as error:
        raise HTTPException(status_code=404, detail=f"indicateur_referentiel_commentaire {epci_id}/{indicateur_id} not found")


@router.delete(
    "/{epci_id}/{indicateur_id}", response_model=Status,
    responses={404: {"model": HTTPNotFoundError}}
)
async def delete_indicateur_referentiel_commentaire(epci_id: str, indicateur_id: str):
    query = IndicateurReferentielCommentaire.filter(epci_id=epci_id, indicateur_id=indicateur_id)
    deleted_count = await query.delete()
    if not deleted_count:
        raise HTTPException(status_code=404, detail=f"indicateur_referentiel_commentaire /{epci_id}/{indicateur_id} not found")
    return Status(message=f"Deleted indicateur_referentiel_commentaire /{epci_id}/{indicateur_id}")
