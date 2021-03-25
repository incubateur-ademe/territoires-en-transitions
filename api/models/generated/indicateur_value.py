from dataclasses import dataclass


@dataclass
class IndicateurValue:
    epci_id: str
    indicateur_id: str
    year: float
    value: str
