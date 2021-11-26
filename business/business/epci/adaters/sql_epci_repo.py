from dataclasses import asdict
from typing import List
from pathlib import Path

from business.epci.domain.epci_repo import AbstractEpciRepository
from business.epci.domain.epci import Epci


class SqlEpciRepository(AbstractEpciRepository):
    def __init__(self, sql_path: Path) -> None:
        self.sql_path = sql_path

    def add_epcis(self, epcis: List[Epci]):
        with open(self.sql_path, "w") as f:
            for epci in epcis:
                epci_as_dict = asdict(epci)
                columns = list(epci_as_dict.keys())
                formated_values = [
                    "'" + value.replace("'", "''") + "'"
                    for value in epci_as_dict.values()
                ]
                sql = f"insert into epci({', '.join(columns)}) values ({', '.join(formated_values)});"
                f.write(f"{sql}\n")
