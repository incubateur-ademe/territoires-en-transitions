import json
import os
from urllib.parse import urlparse

import psycopg
import typer
from psycopg import Connection, Cursor

business_tables = {"read": ["business_action_statut"], "write": ["score"]}
client_tables = {"read": ["client_epci"], "write": ["action_statut"]}

default_postgres_url = f"postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:49154/postgres"


def postgres_connection(postgres_url: str) -> Connection:
    db_params = urlparse(postgres_url)
    params = dict(
        dbname=db_params.path[1:],
        user=db_params.username,
        password=db_params.password,
        host=db_params.hostname,
        port=db_params.port,
    )
    return psycopg.connect(**params)


def initialized_cursor(connection: Connection) -> Cursor:
    cursor = connection.cursor()
    development = open("postgres/development.sql", "r").read()
    cursor.execute(development)
    return cursor


def main(
    output: str = typer.Argument("generated"),
    business: bool = typer.Option(False, help="generate business typedefs"),
    client: bool = typer.Option(False, help="generate client typedefs"),
    postgres_url: str = typer.Argument(default_postgres_url, envvar="POSTGRES_URL"),
):
    if (business and client) or (not business and not client):
        typer.echo("use either --business OR --client", err=True)
        return

    if business:
        tables = business_tables
        typer.echo("generating business typedefs...")
    elif client:
        tables = client_tables
        typer.echo("generating business typedefs...")

    cursor = initialized_cursor(postgres_connection(postgres_url))
    cursor.execute("select * from table_as_json_typedef")
    schemas = cursor.fetchall()
    for schema_row in schemas:
        title = schema_row[0]
        read = schema_row[1]
        write = schema_row[2]

        if title in tables["read"]:
            with open(os.path.join(output, f"{title}-read.json"), "w") as file:
                json.dump(read, file, indent="  ")

        if title in tables["write"]:
            with open(os.path.join(output, f"{title}-write.json"), "w") as file:
                json.dump(write, file, indent="  ")


if __name__ == "__main__":
    typer.run(main)
