from dataclasses import dataclass


@dataclass
class DomainEvent:
    pass


@dataclass
class DomainFailureEvent(DomainEvent):
    reason: str
