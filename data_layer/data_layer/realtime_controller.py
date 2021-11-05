import abc


class RealtimeController(abc.ABC):
    @abc.abstractmethod
    def start(self, realtime) -> None:
        pass
