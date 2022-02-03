from dataclasses import dataclass


@dataclass
class Commune:
    nom: str
    code: str


# TODO : this should be infered from CommuneWrite generated model.
