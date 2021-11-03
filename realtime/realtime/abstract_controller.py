import abc


class AbstractRealtimeController(abc.ABC):
    @abc.abstractmethod
    def start(self, realtime) -> None:
        pass
