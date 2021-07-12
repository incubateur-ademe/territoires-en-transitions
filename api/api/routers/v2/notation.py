from typing import List

from fastapi import APIRouter

from api.models.generated.action_referentiel_score import ActionReferentielScore
from api.models.tortoise.action_status import ActionStatus_Pydantic, ActionStatus
from api.notation.economie_circulaire import Notation, Statut, referentiel_eci

router = APIRouter(prefix='/v2/notation')


@router.get("/eci/{epci_id}/all", response_model=List[ActionReferentielScore])
async def get_eci_scores(epci_id: str):
    query = ActionStatus.filter(epci_id=epci_id, latest=True)
    status: List[ActionStatus] = await ActionStatus_Pydantic.from_queryset(query)
    notation = Notation(referentiel_eci)

    for s in status:
        if s.action_id.startswith('economie_circulaire'):
            index = tuple(s.action_id.split('__')[-1].split('.'))
            
            # convert the avancement set by the user to a statut for the notation engine
            notation_statut = Statut.from_avancement(s.avancement)

            # set the status in the epci notation so the scores can be computed.
            notation.set_statut(index, notation_statut)

    return notation.scores()
