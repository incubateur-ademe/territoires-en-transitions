import os
import json
from typing import Tuple

from pathlib import Path
import pytest

from business.entrypoints.referentiels import store_referentiels_actions
from tests.utils.files import remove_file, mkdir


json_path = Path("./tests/data/tmp/referentiels.json")
mkdir(json_path.parent)


@pytest.mark.parametrize(
    "referentiel_and_expected_nb_of_actions",
    [("eci", 367), ("cae", 1472)],
)
def test_update_referentiels(referentiel_and_expected_nb_of_actions: Tuple[str, int]):
    referentiel, expected_nb_of_actions = referentiel_and_expected_nb_of_actions
    remove_file(json_path)

    try:
        store_referentiels_actions(
            [
                "--repo-option",
                "JSON",
                "--json-path",
                json_path,
                f"../markdown/referentiels/{referentiel}",
            ]
        )
    except SystemExit:
        pass
    assert os.path.isfile(json_path)

    with json_path.open("r") as file:
        data = json.load(file)

    assert referentiel in data
    assert (
        len(data[referentiel]["definitions"])
        == len(data[referentiel]["children"])
        == len(data[referentiel]["points"])
        == expected_nb_of_actions
    )
