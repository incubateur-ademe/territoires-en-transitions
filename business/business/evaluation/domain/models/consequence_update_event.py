from dataclasses import dataclass


@dataclass
class ConsequenceUpdateEvent:
    collectivite_id: int
    created_at: str
    id: int
