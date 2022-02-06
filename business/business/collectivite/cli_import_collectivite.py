from pathlib import Path
from typing import Literal, Optional

from business.collectivite.domain.import_banatic_xlsx_to_collectivite_repo import (
    import_banatic_xlsx_to_collectivite_repo,
)
from business.collectivite.domain.import_insee_communes_to_collectivite_repo import (
    import_insee_communes_to_collectivite_repo,
)
from business.collectivite.adapters.csv_collectivite_repo import (
    CsvCollectiviteRepository,
)
from business.collectivite.adapters.sql_collectivite_repo import (
    SqlCollectiviteRepository,
)

import click


# 3. Prepare domain event bus (dependencies infection)
@click.command()
@click.option(
    "--repo-option",
    prompt="EPCI repository option",
)
@click.option(
    "--output-epci-path",
    required=False,
    default="",
    prompt="Output path to save EPCI file (in CSV, SQL mode)",
)
@click.option(
    "--output-commune-path",
    required=False,
    default="",
    prompt="Output path to save commune file (in CSV, SQL mode)",
)
def cli_import_collectivite(
    repo_option: Literal["CSV", "SQL"],
    output_epci_path: Optional[str] = None,
    output_commune_path: Optional[str] = None,
):
    """Parse, convert and store referentiels actions and indicateurs given IN/OUT folders."""
    if repo_option == "CSV":
        repo = CsvCollectiviteRepository(
            Path(output_epci_path or "business/collectivite/data/epcis_2021.csv"),
            Path(output_epci_path or "business/collectivite/data/communes_2021.csv"),
        )
    elif repo_option == "SQL":
        repo = SqlCollectiviteRepository(
            Path(output_epci_path or "business/collectivite/data/epci_2021.sql"),
            Path(output_commune_path or "business/collectivite/data/communes_2021.sql"),
        )
    else:
        raise ValueError
    import_banatic_xlsx_to_collectivite_repo(
        repo,
        input_xlsx="business/collectivite/data/banatic_2021.xlsx",
    )
    import_insee_communes_to_collectivite_repo(
        repo,
        input_communes_csv="business/collectivite/data/commune2021.csv",
        input_communes_data_csv="business/collectivite/data/donnees_communes2021.csv",
    )


if __name__ == "__main__":
    cli_import_collectivite()
