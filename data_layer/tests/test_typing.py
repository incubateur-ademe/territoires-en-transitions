import json
import os.path

import pytest


@pytest.fixture()
def initialized_cursor(postgres_connection, request):
    cursor = postgres_connection.cursor()
    development = open("postgres/development.sql", "r").read()
    cursor.execute(development)
    request.addfinalizer(cursor.close)

    return cursor


def test_table_epci_returns_a_valid_json_schema(initialized_cursor):
    tables_as_json_schemas = "select * from table_as_json_typedef where title = 'epci';"
    initialized_cursor.execute(tables_as_json_schemas)
    schemas = initialized_cursor.fetchall()
    assert len(schemas) == 1
    assert schemas[0][1] == {
        "properties": {
            "siren": {"type": "string"},
            "nom": {"type": "string"},
        }
    }


def test_table_action_statut_returns_a_valid_json_schema_with_enum(initialized_cursor):
    tables_as_json_schemas = (
        "select * from view_as_json_typedef where title = 'business_action_statut';"
    )
    initialized_cursor.execute(tables_as_json_schemas)
    schemas = initialized_cursor.fetchall()
    assert len(schemas) == 1
    assert schemas[0][1] == {
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


def test_table_as_json_schema_should_save_schemas(initialized_cursor):
    tables_as_json_schemas = open(
        "postgres/queries/get_all_tables_as_json_typedefs.sql", "r"
    ).read()
    initialized_cursor.execute(tables_as_json_schemas)
    schemas = initialized_cursor.fetchall()

    for schema in schemas:
        title = schema[0]
        json_typedef = schema[1]
        with open(os.path.join("generated", f"{title}.json"), "w") as file:
            json.dump(json_typedef, file, indent="  ")
