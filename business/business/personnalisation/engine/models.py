from dataclasses import dataclass
from typing import List, Optional, Union

from business.referentiel.domain.models.question import QuestionType


@dataclass
class Reponse:
    question_id: str
    value: Union[str, float, bool]


@dataclass
class Question:
    question_id: str
    type: QuestionType
    choix_ids: Optional[List[str]] = None
