import click
import os
from pathlib import Path
import psycopg
from typing import Literal

from business.epci.domain.import_banatic_xlsx_to_epci_repo import (
    import_banatic_xlsx_to_epci_repo,
)
from business.epci.adaters.csv_epci_repo import CsvEpciRepository
from business.epci.adaters.postgres_epci_repo import PostgresEpciRepository
from business.utils.get_postgres_connection_params import get_postgres_connection_params

# 3. Prepare domain event bus (dependencies infection)
@click.command()
@click.option(
    "--repo-option",
    prompt="EPCI repository option",
)
@click.option("--postgres-url", default=lambda: os.environ.get("POSTGRES_URL"))
def cli_import_epci(repo_option: Literal["CSV", "POSTGRES"], postgres_url: str):
    """Parse, convert and store referentiels actions and indicateurs given IN/OUT folders."""
    if repo_option == "CSV":
        repo = CsvEpciRepository(Path("business/epci/data/epcis_2021.csv"))
    elif repo_option == "POSTGRES":
        connection = psycopg.connect(**get_postgres_connection_params(postgres_url))
        repo = PostgresEpciRepository(connection)
    else:
        raise ValueError
    import_banatic_xlsx_to_epci_repo(
        repo,
        input_xlsx="business/epci/data/banatic_2021.xlsx",
    )


if __name__ == "__main__":
    cli_import_epci()
