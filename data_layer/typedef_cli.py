import json
import os
import subprocess
from pathlib import Path
from urllib.parse import urlparse

import psycopg
import typer
from psycopg import Connection, Cursor

business_tables = {"read": ["business_action_statut"], "write": ["score"]}
client_tables = {
    "read": ["client_epci", "action_statut", "action_commentaire"],
    "write": ["action_statut", "action_commentaire"],
}

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
    output_dir: str = typer.Argument("generated", help="The output folder."),
    postgres_url: str = typer.Argument(
        default_postgres_url,
        envvar="POSTGRES_URL",
        help="A postgres url with a 'table_as_json_typedef' table",
    ),
    jtd_codegen: str = typer.Argument(
        "jtd-codegen", envvar="JTD_CODEGEN", help="The jtd-codegen executable."
    ),
    business: bool = typer.Option(False, help="Generate business typedefs."),
    client: bool = typer.Option(False, help="Generate client typedefs."),
    remove_jtd_files: bool = typer.Option(
        True, help="Remove intermediary json type def files from the output folder."
    ),
):
    if (business and client) or (not business and not client):
        typer.echo("use either --business OR --client", err=True)
        return

    if business:
        tables = business_tables
        language = "python"
        typer.echo("Generating business typedefs...")
    elif client:
        tables = client_tables
        language = "typescript"
        typer.echo("Generating client typedefs...")

    cursor = initialized_cursor(postgres_connection(postgres_url))
    cursor.execute("select * from table_as_json_typedef")
    schemas = cursor.fetchall()
    saved = []

    with typer.progressbar(schemas) as progress:
        for schema_row in progress:
            title = schema_row[0]
            read = schema_row[1]
            write = schema_row[2]

            if title in tables["read"]:
                filename = f"{title}_read.jtd.json"
                with open(os.path.join(output_dir, filename), "w") as file:
                    json.dump(read, file, indent="  ")
                    saved.append((f"{title}_read", filename))

            if title in tables["write"]:
                filename = f"{title}_write.jtd.json"
                with open(os.path.join(output_dir, filename), "w") as file:
                    json.dump(write, file, indent="  ")
                    saved.append((f"{title}_write", filename))

    typer.echo("Executing jtd-codegen")
    with typer.progressbar(saved) as progress:
        for title, filename in progress:
            input = os.path.join(output_dir, filename)
            output = os.path.join(output_dir, title)
            Path(output).mkdir(exist_ok=True)
            subprocess.run(
                [
                    jtd_codegen,
                    input,
                    f"--{language}-out",
                    output,
                ],
                shell=True,
            )
            os.path.join(output_dir, filename)

    if remove_jtd_files:
        typer.echo("Removing intermediary json type def files.")
        with typer.progressbar(saved) as progress:
            for title, filename in progress:
                os.remove(os.path.join(output_dir, filename))


if __name__ == "__main__":
    typer.run(main)
