from dataclasses import dataclass
from typing import Union


@dataclass
class Reponse:
    """Reponse to a question."""

    id: str
    value: Union[str, float]
