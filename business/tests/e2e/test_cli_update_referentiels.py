import os
import json

from pathlib import Path
import pytest

from business.entrypoints.referentiels import store_referentiels_command
from tests.utils.files import remove_file, mkdir


json_path = Path("./tests/data/tmp/referentiels.json")
mkdir(json_path.parent)


expected_nb_of_actions = {"eci": 367, "cae": 1472}
expected_nb_of_indicateurs = {"eci": 35, "cae": 108}


@pytest.mark.parametrize(
    "referentiel",
    ["eci", "cae"],
)
def test_update_referentiels(referentiel: str):

    remove_file(json_path)

    try:
        store_referentiels_command(
            [
                "--repo-option",
                "JSON",
                "--to-json",
                json_path,
                "--referentiel",
                referentiel,
            ]
        )
    except SystemExit:
        pass
    assert os.path.isfile(json_path)

    with json_path.open("r") as file:
        data = json.load(file)

    actions = data["actions"]
    assert referentiel in actions
    assert (
        len(actions[referentiel]["definitions"])
        == len(actions[referentiel]["children"])
        == len(actions[referentiel]["points"])
        == expected_nb_of_actions[referentiel]
    )
    assert len(data["indicateurs"]) == expected_nb_of_indicateurs[referentiel]


# Note : CRTE is not tested here, it requires having previously stored CAE indicateurs
