from dataclasses import asdict
from typing import List, Optional
from pathlib import Path

import pandas as pd
from business.collectivite.domain.commune import Commune

from business.collectivite.domain.epci import Epci
from business.collectivite.domain.collectivite_repo import (
    InMemoryCollectiviteRepository,
)


class CsvCollectiviteRepository(InMemoryCollectiviteRepository):
    def __init__(
        self, csv_epci_output: Path,csv_commune_output: Path, epcis: Optional[List[Epci]] = None
    ) -> None:
        super().__init__(epcis=epcis)
        self.csv_epci_output = csv_epci_output
        self.csv_commune_output = csv_commune_output
        self._to_csv()

    def add_epcis(self, epcis: List[Epci]):
        super().add_epcis(epcis)
        self._to_csv()

    def add_communes(self, communes: List[Commune]):
        super().add_communes(communes)
        self._to_csv()

    def _to_csv(self):
        pd.DataFrame([asdict(epci) for epci in self.epcis]).to_csv(self.csv_epci_output)
        pd.DataFrame([asdict(commune) for commune in self.communes]).to_csv(self.csv_commune_output)