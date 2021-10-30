from typing import NewType

from business.domain.models.litterals import ReferentielId

# TODO : move this file to domain. 

ActionId = NewType("ActionId", str)

def build_action_id(referentiel_id: ReferentielId, identifiant: str) -> ActionId:
    if identifiant == "": return ActionId(referentiel_id)
    return ActionId(f"{referentiel_id}_{identifiant}")

def retrieve_referentiel_id(action_id: ActionId) -> ReferentielId:
    # TODO : regex
    return action_id.split("_")[0] # type: ignore