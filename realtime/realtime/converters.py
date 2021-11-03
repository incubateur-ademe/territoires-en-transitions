import abc
from dataclasses import dataclass

from realtime.models.events import EpciActionStatusUpdateEvent, Event


class Converter(abc.ABC):
    @staticmethod
    @abc.abstractmethod
    def filter(raw: dict) -> bool:
        pass

    @staticmethod
    @abc.abstractmethod
    def convert(raw: dict) -> Event:
        pass


@dataclass
class ConvertErrorEvent(Event):
    raw: dict


class EpciActionStatusUpdateConverter(Converter):
    @staticmethod
    def filter(raw: dict) -> bool:
        return raw["table"] == "epci_action_statut_update" and raw["type"] == "INSERT"

    @staticmethod
    def convert(raw: dict) -> Event:
        record: dict = raw["record"]
        try:
            return EpciActionStatusUpdateEvent(
                epci_id=record["epci_id"], created_at=record["created_at"]
            )
        except:
            return ConvertErrorEvent(raw=raw)
