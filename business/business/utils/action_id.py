from typing import NewType

from business.core.domain.models.referentiel import ActionReferentiel

# TODO : move this file to domain.

ActionId = NewType("ActionId", str)


def build_action_id(referentiel: ActionReferentiel, identifiant: str) -> ActionId:
    if identifiant == "":
        return ActionId(referentiel)
    return ActionId(f"{referentiel}_{identifiant}")


def retrieve_referentiel(action_id: ActionId) -> ActionReferentiel:
    # TODO : regex
    return action_id.split("_")[0]  # type: ignore
