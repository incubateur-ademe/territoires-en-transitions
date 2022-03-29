from dataclasses import dataclass


@dataclass
class ReponseUpdateEvent:
    collectivite_id: int
    created_at: str
    id: int
