from typing import List

from fastapi import HTTPException, Depends
from tortoise.contrib.pydantic.base import PydanticModel
from tortoise.exceptions import DoesNotExist

from api.models.tortoise.any_indicateur_values import (
    IndicateurValueGeneric,
)
from api.models.tortoise.utilisateur_droits import UtilisateurDroits_Pydantic
from api.routers.v2.auth import get_utilisateur_droits_from_header, can_write_epci


class IndicateurValueGenericAPI:
    def __init__(
        self,
        TortoiseModel: IndicateurValueGeneric,
        PydanticInModel: PydanticModel,
        PydanticOutModel: PydanticModel,
    ) -> None:
        self.TortoiseModel = TortoiseModel
        self.PydanticInModel = PydanticInModel
        self.PydanticOutModel = PydanticOutModel

    async def post_epci_indicateur_value(
        self,
        epci_id: str,
        indicateur_value: IndicateurValueGeneric,
        droits: List[UtilisateurDroits_Pydantic] = Depends(
            get_utilisateur_droits_from_header
        ),
    ):
        if epci_id != indicateur_value.epci_id:
            raise HTTPException(status_code=400, detail="epci_id mismatch")

        if not can_write_epci(epci_id, droits):
            raise HTTPException(
                status_code=401, detail=f"droits not found for epci {epci_id}"
            )

        query = self.TortoiseModel.filter(
            epci_id=epci_id,
            indicateur_id=indicateur_value.indicateur_id,
            year=indicateur_value.year,
        )

        if await query.exists():
            await query.update(latest=False)

        indicateur_value_obj = await self.TortoiseModel.create(
            **indicateur_value.dict(exclude_unset=True),
            latest=True,
        )
        return await self.PydanticOutModel.from_tortoise_orm(indicateur_value_obj)

    async def get_all_epci_indicateurs_values(self, epci_id: str):
        query = self.TortoiseModel.filter(epci_id=epci_id, latest=True)
        return await self.PydanticOutModel.from_queryset(query)

    async def get_indicateur_yearly_values(self, epci_id: str, indicateur_id: str):
        filter_query = self.TortoiseModel.filter(
            epci_id=epci_id, indicateur_id=indicateur_id, latest=True
        )
        return await self.PydanticOutModel.from_queryset(filter_query)

    async def get_indicateur_value(self, epci_id: str, indicateur_id: str, year: int):
        query = self.TortoiseModel.get(
            epci_id=epci_id, indicateur_id=indicateur_id, year=year, latest=True
        )
        try:
            return await self.PydanticOutModel.from_queryset_single(query)
        except DoesNotExist as error:
            raise HTTPException(
                status_code=404,
                detail=f"Indicateur_value {epci_id}/{indicateur_id}/{year} not found",
            )
