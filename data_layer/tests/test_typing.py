from dataclasses import make_dataclass, field as dcfield

import pytest


@pytest.fixture()
def initialized_cursor(postgres_connection, request):
    cursor = postgres_connection.cursor()
    development = open("postgres/development.sql", "r").read()
    cursor.execute(development)
    request.addfinalizer(cursor.close)

    return cursor


def test__(initialized_cursor):
    def make_class(table_name):
        initialized_cursor.execute(f"select * from {table_name};")
        initialized_cursor.execute()
        description = initialized_cursor.description
        print(initialized_cursor.description)

        it = table_name

        classname = it.name.title()

        columns = [(c.name, c.pytype, dcfield(default=None)) for c in it.columns]

        return make_dataclass(classname, columns)

    ActionStatut = make_class("action_statut")
    print(ActionStatut.__repr__())
