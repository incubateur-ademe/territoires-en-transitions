from dataclasses import dataclass


class Event:
    pass


@dataclass
class EpciActionStatusUpdateEvent(Event):
    """Represent an update of any statut of an EPCI"""
    epci_id: str
    created_at: str
