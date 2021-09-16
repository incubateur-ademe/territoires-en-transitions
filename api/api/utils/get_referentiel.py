from typing import Literal
from api.models.generated.action_referentiel import ActionReferentiel
from api.models.generated.action_status import ActionStatus


Referentiel = Literal["eci", "cae"]


class InvalidActionReferentielId(Exception):
    pass


def _get_referentiel_from_action_id(action_id: str) -> Referentiel:
    if action_id.startswith("economie_circulaire"):
        return "eci"
    elif action_id.startswith("citergie"):
        return "cae"
    raise InvalidActionReferentielId(
        f"Action id should start with either `economie_circulaire` or `citergie`.\nReceived {action_id} "
    )


def get_referentiel_from_action(action: ActionReferentiel) -> Referentiel:
    return _get_referentiel_from_action_id(action.id)


def get_referentiel_from_status(action_status: ActionStatus):
    return _get_referentiel_from_action_id(action_status.action_id)
