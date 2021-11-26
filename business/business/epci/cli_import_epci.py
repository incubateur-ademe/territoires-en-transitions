import click
import os
from pathlib import Path
import psycopg
from typing import Literal, Optional

from business.epci.domain.import_banatic_xlsx_to_epci_repo import (
    import_banatic_xlsx_to_epci_repo,
)
from business.epci.adaters.csv_epci_repo import CsvEpciRepository
from business.epci.adaters.sql_epci_repo import SqlEpciRepository

# 3. Prepare domain event bus (dependencies infection)
@click.command()
@click.option(
    "--repo-option",
    prompt="EPCI repository option",
)
@click.option(
    "--output-path",
    required=False,
    default="",
    prompt="Output path to save file (in CSV, SQL mode)",
)
def cli_import_epci(
    repo_option: Literal["CSV", "SQL"],
    output_path: Optional[str] = None,
):
    """Parse, convert and store referentiels actions and indicateurs given IN/OUT folders."""
    if repo_option == "CSV":
        repo = CsvEpciRepository(
            Path(output_path or "business/epci/data/epcis_2021.csv")
        )
    elif repo_option == "SQL":
        repo = SqlEpciRepository(
            Path(output_path or "business/epci/data/epcis_2021.sql")
        )
    else:
        raise ValueError
    import_banatic_xlsx_to_epci_repo(
        repo,
        input_xlsx="business/epci/data/banatic_2021.xlsx",
    )


if __name__ == "__main__":
    cli_import_epci()
