from dataclasses import asdict
from typing import List

import psycopg

from business.epci.domain.epci_repo import AbstractEpciRepository
from business.epci.domain.epci import Epci
from business.utils.postgres_repo import PostgresRepository, PostgresRepositoryError


class PostgresEpciRepository(AbstractEpciRepository, PostgresRepository):
    def __init__(self, connection: psycopg.Connection) -> None:
        PostgresRepository.__init__(self, connection)

    def add_epcis(self, epcis: List[Epci]):
        for epci in epcis:
            epci_as_dict = asdict(epci)
            columns = " ,".join(list(epci_as_dict.keys()))
            values_to_interpolate = " ,".join(
                [f"%({column})s" for column in epci_as_dict.keys()]
            )
            sql = f"insert into epci ({columns}) values ({values_to_interpolate});"
            try:
                self.cursor.execute(sql, epci_as_dict)
            except psycopg.errors.ForeignKeyViolation as error:
                raise PostgresRepositoryError(str(error))
