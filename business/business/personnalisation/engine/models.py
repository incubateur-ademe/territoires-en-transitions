from dataclasses import dataclass
from typing import List, Optional, Union

from business.referentiel.domain.models.question import QuestionType


@dataclass
class Reponse:
    id: str
    value: Union[str, float, bool]


@dataclass
class Question:
    id: str
    type: QuestionType
    choix_ids: Optional[List[str]] = None
