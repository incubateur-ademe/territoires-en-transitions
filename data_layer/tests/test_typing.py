from dataclasses import dataclass

import pytest
from pydantic import create_model
from pydantic.main import ModelMetaclass
from pydantic.schema import schema


@pytest.fixture()
def initialized_cursor(postgres_connection, request):
    cursor = postgres_connection.cursor()
    development = open("postgres/development.sql", "r").read()
    cursor.execute(development)
    request.addfinalizer(cursor.close)

    return cursor


@dataclass
class RowDefinition:
    column_name: str
    ordinal_position: str
    column_default: str
    is_nullable: str
    data_type: str
    character_maximum_length: str
    datetime_precision: str
    domain_name: str
    udt_name: str


def test_from_a_table_we_should_make_a_class(initialized_cursor):
    def make_class(table_name, classname):
        table_definition = open("postgres/queries/table_definition.sql", "r").read()
        table_definition = table_definition.replace(":table_name", "%s")

        initialized_cursor.execute(table_definition, (table_name,))
        results = initialized_cursor.fetchall()
        row_definitions = [RowDefinition(*row) for row in results]

        return create_model(
            classname, **{definition.column_name: str for definition in row_definitions}
        )

    ActionStatut = make_class("action_statut", "ActionStatut")
    assert isinstance(ActionStatut, ModelMetaclass)
    json_schema = schema([ActionStatut])
    print(json_schema)


def test_from_a_table_we_should_make_a_json_schema(initialized_cursor):
    def make_schema(table_name, classname):
        table_definition = open("postgres/queries/table_definition.sql", "r").read()
        table_definition = table_definition.replace(":table_name", "%s")

        initialized_cursor.execute(table_definition, (table_name,))
        results = initialized_cursor.fetchall()
        row_definitions = [RowDefinition(*row) for row in results]

        def udt_to_json_type(udt: str):
            udt_type = {
                "int": "integer",
                "bool": "boolean",
                "float": "number",
                "uuid": "string",
                "varchar": "string",
                "timestamptz": "string",
            }
            for udt_part, json_type in udt_type.items():
                if udt.startswith(udt_part):
                    return json_type
            return "string"

        properties = {
            definition.column_name: {
                "type": udt_to_json_type(definition.udt_name),
            }
            for definition in row_definitions
        }

        required = [
            definition.column_name
            for definition in row_definitions
            if definition.is_nullable == "NO" and not definition.column_default
        ]

        return {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": classname,
            "type": "object",
            "properties": properties,
            "required": required,
        }

    schema = make_schema("action_statut", "ActionStatut")
    assert schema
    print(schema)

    schema = make_schema("epci", "Epci")
    assert schema
    print(schema)
