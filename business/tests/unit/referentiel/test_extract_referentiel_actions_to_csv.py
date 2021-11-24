import os
from pathlib import Path

import pandas as pd

from business.referentiel.domain.models import events
from business.referentiel.domain.ports.referentiel_repo import (
    InMemoryReferentielRepository,
)
from business.referentiel.domain.use_cases.extract_referentiel_actions_to_csv import (
    ExtractReferentielActionsToCsv,
)
from business.referentiel.adapters.json_referentiel_repo import (
    JsonReferentielRepository,
)

from tests.utils.referentiel_factory import make_dummy_referentiel
from tests.utils.files import remove_file, mkdir


def test_can_extract_referentiel_actions_to_csv():
    csv_path = Path("./tests/data/tmp/ref.csv")
    mkdir(csv_path.parent)
    remove_file(csv_path)
    children, definitions, points = make_dummy_referentiel(
        action_ids=["eci", "eci_1", "eci_2", "eci_1.1", "eci_2.0", "eci_10"],
        referentiel="eci",
    )
    referentiel_repo = InMemoryReferentielRepository(children, definitions, points)
    use_case = ExtractReferentielActionsToCsv(referentiel_repo)

    trigger = events.ExtractReferentielActionsToCsvTriggered(
        referentiel="eci", csv_path=csv_path
    )

    use_case.execute(trigger)

    assert os.path.isfile(csv_path)

    df = pd.read_csv(csv_path, index_col=0)
    assert all(df.columns.values == ["identifiant", "nom", "value"])
    assert all(
        df.index.values == ["eci", "eci_1", "eci_1.1", "eci_2", "eci_2.0", "eci_10"]
    )


def test_convert_eci_referentiel_actions_to_csv():

    csv_path = Path("./data/eci_referentiel.csv")
    mkdir(csv_path.parent)
    remove_file(csv_path)

    referentiel_repo = JsonReferentielRepository(
        Path("./data/referentiel_repository.json")
    )
    use_case = ExtractReferentielActionsToCsv(referentiel_repo)

    trigger = events.ExtractReferentielActionsToCsvTriggered(
        referentiel="eci", csv_path=csv_path
    )

    use_case.execute(trigger)
    assert os.path.isfile(csv_path)
