from realtime_py import Socket

from realtime.abstract_controller import AbstractRealtimeController
from realtime import Realtime


class SupabaseRealtimeController(AbstractRealtimeController):
    def __init__(self, socket: Socket):
        self.socket = socket

    def start(self, realtime: Realtime) -> None:
        channel = self.socket.set_channel("realtime:public:epci_action_statut_update")
        channel.join().on("INSERT", realtime.raw_source.on_next)
