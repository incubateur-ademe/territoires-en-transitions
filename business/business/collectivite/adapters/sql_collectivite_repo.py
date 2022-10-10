from typing import List
from pathlib import Path

from business.collectivite.domain.collectivite_repo import (
    AbstractCollectiviteRepository,
)
from business.collectivite.domain.epci import Epci
from business.collectivite.domain.commune import Commune


class SqlCollectiviteRepository(AbstractCollectiviteRepository):
    def __init__(self, sql_epci_path: Path, sql_commune_path: Path) -> None:
        self.sql_epci_path = sql_epci_path
        self.sql_commune_path = sql_commune_path

    def add_epcis(self, epcis: List[Epci]):
        with open(self.sql_epci_path, "w") as f:
            for epci in epcis:
                sql = f"insert into epci(nom, siren, nature) values ({format_sql_text(epci.nom)}, '{epci.siren}', '{epci.nature}');"
                f.write(f"{sql}\n")

    def add_communes(self, communes: List[Commune]):
        with open(self.sql_commune_path, "w") as f:
            for commune in communes:
                sql = f"insert into commune(nom, code) values ({format_sql_text(commune.nom)}, '{commune.code}');"
                f.write(f"{sql}\n")


def format_sql_text(text: str):
    text = text.replace("'", "''")
    return f"'{text}'"
