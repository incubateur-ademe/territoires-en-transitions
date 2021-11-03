from realtime_py.connection import Socket
from rx.subject import Subject

from data_layer.realtime import Realtime

SUPABASE_ID = ""
API_KEY = ""

if __name__ == "__main__":
    raw_source = Subject()
    realtime = Realtime(raw_source)
    realtime.event_source.subscribe(lambda value: print("Event: {0}".format(value)))

    URL = f"ws://{SUPABASE_ID}.supabase.co/realtime/v1/websocket?apikey={API_KEY}&vsn=1.0.0"
    s = Socket(URL)
    s.connect()

    channel = s.set_channel("realtime:public:epci_action_statut_update")
    channel.join().on("INSERT", raw_source.on_next)

    s.listen()
