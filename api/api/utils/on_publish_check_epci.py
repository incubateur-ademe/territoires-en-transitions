from typing import List
from fastapi import HTTPException

from api.routers.v2.auth import can_write_epci
from api.models.tortoise.utilisateur_droits import UtilisateurDroits_Pydantic


def on_publish_check_epci(
    epci_id_in_path: str,
    epci_id_in_field: str,
    droits: List[UtilisateurDroits_Pydantic],
):
    if epci_id_in_path != epci_id_in_field:
        raise HTTPException(status_code=400, detail="epci_id mismatch")
    epci_id = epci_id_in_path
    if not can_write_epci(epci_id, droits):
        raise HTTPException(
            status_code=401, detail=f"droits not found for epci {epci_id}"
        )
