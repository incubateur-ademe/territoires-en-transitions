from typing import List

import supabase

from generated_models.store_action_statut import StoreActionStatut
from generated_models.view_action_statut import ViewActionStatut
from generated_models.view_computed_score import ViewComputedScore
from generated_models.view_epci import ViewEpci


class Client:
    """The stuff that should happen client side"""

    def __init__(self, supabase_client: supabase.Client) -> None:
        super().__init__()
        self.supabase_client = supabase_client

    def list_epci(self):
        select = self.supabase_client.from_("view_epci").select("*").execute()
        data = select.get("data", [])
        return [ViewEpci(**d) for d in data]

    def save_statut(self, statut: StoreActionStatut):
        return (
            self.supabase_client.from_("store_action_statut")
            .insert(statut.dict(), upsert=True)
            .execute()
        )

    def list_statut(self, epci_id) -> List[ViewActionStatut]:
        select = (
            self.supabase_client.from_("view_action_statut")
            .select("*")
            .eq("epci_id", epci_id)
            .execute()
        )
        data = select.get("data", [])
        return [ViewActionStatut(**d) for d in data]

    def list_score(self, epci_id) -> List[ViewComputedScore]:
        select = (
            self.supabase_client.from_("view_computed_score")
            .select("*")
            .eq("epci_id", epci_id)
            .execute()
        )
        data = select.get("data", [])
        return [ViewComputedScore(**d) for d in data]

    def listen_score(self, epci_id, callback: callable):
        # todo this won't work, we should use our own socket
        self.supabase_client.from_(f"view_computed_score:epci_id={epci_id}").on(
            "*", callback
        ).subscribe()
