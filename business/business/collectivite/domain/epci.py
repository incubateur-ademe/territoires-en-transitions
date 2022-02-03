from dataclasses import dataclass
from typing import Literal


EpciNature = Literal[
    "SMF",
    "CU",
    "CC",
    "SIVOM",
    "POLEM",
    "MET69",
    "METRO",
    "SMO",
    "CA",
    "EPT",
    "SIVU",
    "PETR",
]


@dataclass
class Epci:
    nom: str
    siren: str
    nature: EpciNature


# TODO : this should be infered from EPCIWrite generated model.
