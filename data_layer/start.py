from realtime_py.connection import Socket

from data_layer.realtime import Realtime
from data_layer.realtime_controller_supabase import RealtimeSupabaseController

SUPABASE_ID = "dmsgonehoayxxzswrwhc"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNTI2MDQ1MSwiZXhwIjoxOTUwODM2NDUxfQ.IByfUKbPzNXWifvU3o23fmigjVXbhNWgarXVBNHrVZ0"

if __name__ == "__main__":
    URL = f"ws://{SUPABASE_ID}.supabase.co/realtime/v1/websocket?apikey={API_KEY}&vsn=1.0.0"
    socket = Socket(URL)
    socket.connect()

    controller = RealtimeSupabaseController(socket)
    realtime = Realtime(controller=controller)
    realtime.start()

    realtime.event_source.subscribe(lambda e: print(e))

    socket.listen()
