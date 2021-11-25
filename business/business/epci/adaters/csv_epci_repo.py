from dataclasses import asdict
from typing import List, Optional
from pathlib import Path

import pandas as pd

from business.epci.domain.epci import Epci
from business.epci.domain.epci_repo import InMemoryEpciRepository


class CsvEpciRepository(InMemoryEpciRepository):
    def __init__(self, csv_output: Path, epcis: Optional[List[Epci]] = None) -> None:
        super().__init__(epcis=epcis)
        self.csv_output = csv_output
        self._to_csv()

    def add_epcis(self, epcis: List[Epci]):
        super().add_epcis(epcis)
        self._to_csv()

    def _to_csv(self):
        pd.DataFrame([asdict(epci) for epci in self.epcis]).to_csv(self.csv_output)
