from dataclasses import dataclass


@dataclass
class ActionStatus:
    action_id: str
    epci_id: str
    avancement: str
