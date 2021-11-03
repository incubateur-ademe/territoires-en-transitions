from realtime_py.connection import Socket

SUPABASE_ID = ""
API_KEY = ""


def insert_root_handler(payload):
    print("*: ", payload)
    # *:  {'columns': [{'flags': ['key'], 'name': 'id', 'type': 'int4', 'type_modifier': 4294967295}, {'flags': [], 'name': 'epci_id', 'type': 'int4', 'type_modifier': 4294967295}, {'flags': [], 'name': 'modified_by', 'type': 'uuid', 'type_modifier': 4294967295}, {'flags': [], 'name': 'referentiel', 'type': 'referentiel', 'type_modifier': 4294967295}, {'flags': [], 'name': 'action_id', 'type': 'text', 'type_modifier': 4294967295}, {'flags': [], 'name': 'avancement', 'type': 'avancement', 'type_modifier': 4294967295}, {'flags': [], 'name': 'concerne', 'type': 'bool', 'type_modifier': 4294967295}, {'flags': [], 'name': 'modified_at', 'type': 'timestamptz', 'type_modifier': 4294967295}], 'commit_timestamp': '2021-10-28T12:57:43Z', 'record': {'action_id': '1.1.1.2', 'avancement': 'fait', 'concerne': 't', 'epci_id': '1', 'id': '56', 'modified_at': '2021-10-28T12:57:43.041463Z', 'modified_by': '2f74a871-b601-4d0e-930d-8b5460ae0270', 'referentiel': 'eci'}, 'schema': 'public', 'table': 'store_action_statut', 'type': 'INSERT'}


def insert_table_handler(payload):
    print("store_action_statut: ", payload)
    # store_action_statut:  {'columns': [{'flags': ['key'], 'name': 'id', 'type': 'int4', 'type_modifier': 4294967295}, {'flags': [], 'name': 'epci_id', 'type': 'int4', 'type_modifier': 4294967295}, {'flags': [], 'name': 'modified_by', 'type': 'uuid', 'type_modifier': 4294967295}, {'flags': [], 'name': 'referentiel', 'type': 'referentiel', 'type_modifier': 4294967295}, {'flags': [], 'name': 'action_id', 'type': 'text', 'type_modifier': 4294967295}, {'flags': [], 'name': 'avancement', 'type': 'avancement', 'type_modifier': 4294967295}, {'flags': [], 'name': 'concerne', 'type': 'bool', 'type_modifier': 4294967295}, {'flags': [], 'name': 'modified_at', 'type': 'timestamptz', 'type_modifier': 4294967295}], 'commit_timestamp': '2021-10-28T12:57:43Z', 'record': {'action_id': '1.1.1.2', 'avancement': 'fait', 'concerne': 't', 'epci_id': '1', 'id': '56', 'modified_at': '2021-10-28T12:57:43.041463Z', 'modified_by': '2f74a871-b601-4d0e-930d-8b5460ae0270', 'referentiel': 'eci'}, 'schema': 'public', 'table': 'store_action_statut', 'type': 'INSERT'}


def insert_event_table_handler(payload):
    print("epci_action_statut_update: ", payload)
    # epci_action_statut_update:  {'columns': [{'flags': [], 'name': 'ecpi_id', 'type': 'int4', 'type_modifier': 4294967295}, {'flags': [], 'name': 'created_at', 'type': 'timestamptz', 'type_modifier': 4294967295}], 'commit_timestamp': '2021-10-28T16:47:28Z', 'record': {'created_at': '2021-10-28T16:47:28.114708Z', 'ecpi_id': '1'}, 'schema': 'public', 'table': 'epci_action_statut_update', 'type': 'INSERT'}


if __name__ == "__main__":
    URL = f"ws://{SUPABASE_ID}.supabase.co/realtime/v1/websocket?apikey={API_KEY}&vsn=1.0.0"
    s = Socket(URL)
    s.connect()

    channel_1 = s.set_channel("realtime:*")
    channel_1.join().on("INSERT", insert_root_handler)

    channel_2 = s.set_channel("realtime:public:store_action_statut")
    channel_2.join().on("INSERT", insert_table_handler)

    channel_3 = s.set_channel("realtime:public:epci_action_statut_update")
    channel_3.join().on("INSERT", insert_event_table_handler)

    s.listen()
