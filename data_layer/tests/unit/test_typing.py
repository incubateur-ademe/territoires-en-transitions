import json
import os.path

from jtd import Schema


def test_table_epci_returns_a_valid_json_schema(initialized_cursor):
    tables_as_json_schemas = "select * from table_as_json_typedef where title = 'epci';"
    initialized_cursor.execute(tables_as_json_schemas)
    schemas = initialized_cursor.fetchall()
    assert len(schemas) == 1
    assert schemas[0]["read"] == {
        "properties": {
            "id": {"type": "int32"},
            "created_at": {"type": "timestamp"},
            "modified_at": {"type": "timestamp"},
            "siren": {"type": "string"},
            "nom": {"type": "string"},
        }
    }


# TODO
def skip_test_table_action_statut_returns_a_valid_json_schema_with_enum(
    initialized_cursor,
):
    tables_as_json_schemas = (
        "select * from table_as_json_typedef where title = 'business_action_statut';"
    )
    initialized_cursor.execute(tables_as_json_schemas)
    schemas = initialized_cursor.fetchall()
    assert len(schemas) == 1
    assert schemas[0]["read"] == {
        "properties": {
            "action_id": {"type": "string"},
            "avancement": {
                "enum": [
                    "faite",
                    "pas_faite",
                    "programmee",
                    "en_cours",
                    "non_renseignee",
                ]
            },
            "concerne": {"type": "boolean"},
        }
    }


def test_table_as_json_typedef_should_return_parsable_typedef_schemas(
    initialized_cursor,
):
    # todo run on all tables
    tables_as_json_typedef = "select * from table_as_json_typedef;"

    initialized_cursor.execute(tables_as_json_typedef)
    schemas = initialized_cursor.fetchall()
    for schema_row in schemas:
        read = schema_row["read"]
        write = schema_row["write"]
        read_schema = Schema.from_dict(read)
        write_schema = Schema.from_dict(write)
        assert read_schema
        assert write_schema


def test_table_as_json_schema_should_save_schemas(initialized_cursor):
    args = {"read": ["business_action_statut"], "write": ["score"]}

    tables_as_json_typedef = "select * from table_as_json_typedef"
    initialized_cursor.execute(tables_as_json_typedef)
    schemas = initialized_cursor.fetchall()
    for schema_row in schemas:
        title = schema_row["title"]
        read = schema_row["read"]
        write = schema_row["write"]

        if title in args["read"]:
            with open(os.path.join("generated", f"{title}-read.json"), "w") as file:
                json.dump(read, file, indent="  ")

        if title in args["write"]:
            with open(os.path.join("generated", f"{title}-write.json"), "w") as file:
                json.dump(write, file, indent="  ")
