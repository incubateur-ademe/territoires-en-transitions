from realtime_py import Socket

from data_layer.realtime import Realtime
from data_layer.realtime_controller import RealtimeController


class RealtimeSupabaseController(RealtimeController):
    def __init__(self, socket: Socket):
        self.socket = socket

    def start(self, realtime: Realtime) -> None:
        channel = self.socket.set_channel("realtime:public:epci_action_statut_update")
        channel.join().on("INSERT", realtime.raw_source.on_next)

