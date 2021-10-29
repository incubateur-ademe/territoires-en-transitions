from typing import Literal, NewType


ReferentielId = Literal["eci", "cae"]

ActionId = NewType("ActionId", str)
