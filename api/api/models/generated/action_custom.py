from dataclasses import dataclass


@dataclass
class ActionCustom:
    uid: str
    epci_id: str
    mesure_id: str
    name: str
    description: str
