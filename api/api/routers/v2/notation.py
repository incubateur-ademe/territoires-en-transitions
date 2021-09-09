from api.utils.get_referentiel import get_referentiel_from_status
from typing import List

from fastapi import APIRouter

from api.models.generated.action_referentiel_score import ActionReferentielScore
from api.models.tortoise.action_status import ActionStatus, ActionStatus_Pydantic
from api.notation.notation import Notation, Status, UnknownActionIndex
from api.notation.referentiels import referentiel_eci  # referentiel_cae

router = APIRouter(prefix="/v2/notation")


@router.get("/eci/{epci_id}/all", response_model=List[ActionReferentielScore])
async def get_eci_scores(epci_id: str):
    query = ActionStatus.filter(epci_id=epci_id, latest=True)
    statuses: List[ActionStatus] = await ActionStatus_Pydantic.from_queryset(query)
    notation = Notation(referentiel_eci)

    for status in statuses:
        if get_referentiel_from_status(status) == "eci":
            index = tuple(status.action_id.split("__")[-1].split("."))

            # convert the avancement set by the user to a statut for the notation engine
            notation_statut = Status.from_action_status_avancement(status.avancement)

            # set the status in the epci notation so the scores can be computed.
            try:
                notation.set_status(index, notation_statut)
            except UnknownActionIndex:
                print(f"Warning - UnknownActionIndex {index}")

    return notation.compute_and_get_scores()


# @router.get("/cae/{epci_id}/all", response_model=List[ActionReferentielScore])
# async def get_cae_scores(epci_id: str) -> List[ActionReferentielScore]:
#     query = ActionStatus.filter(epci_id=epci_id, latest=True)
#     statuses: List[ActionStatus] = await ActionStatus_Pydantic.from_queryset(query)
#     notation = Notation(referentiel_cae)

#     for status in statuses:
#         if get_referentiel_from_status(status) == "cae":
#             index = tuple(status.action_id.split("__")[-1].split("."))

#             # convert the avancement set by the user to a statut for the notation engine
#             notation_statut = Status.from_action_status_avancement(status.avancement)

#             # set the status in the epci notation so the scores can be computed.
#             try:
#                 notation.set_status(index, notation_statut)
#             except UnknownActionIndex:
#                 print(f"Warning - UnknownActionIndex {index}")

#     return notation.compute_and_get_scores()
