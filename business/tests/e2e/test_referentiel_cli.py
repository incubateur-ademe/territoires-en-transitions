import os
import json
from pathlib import Path
import pytest

from business.referentiel.domain.models.action_children import ActionChildren
from business.referentiel.domain.models.action_computed_point import (
    ActionComputedPoint,
)
from business.referentiel.entrypoints.cli import store_referentiels
from tests.utils.files import remove_file, mkdir
from tests.utils.assert_children_points_sum_to_parent_point import (
    assert_children_points_sum_to_parent_point,
)

json_path = Path("./tests/data/tmp/referentiels.json")
mkdir(json_path.parent)


expected_nb_of_actions = {"eci": 368, "cae": 1478}
expected_nb_of_indicateurs = {"eci": 35, "cae": 123}

expected_points = {
    "eci": {"eci": 500},
    "cae": {
        "cae": 500,
        "cae_1": 100,
        "cae_2": 64,
        "cae_3": 94,
        "cae_4": 96,
        "cae_5": 46,
        "cae_6": 100,
    },
}


@pytest.mark.parametrize("referentiel", ["cae", "eci"])
def skip_test_update_referentiels(referentiel: str):

    remove_file(json_path)

    try:
        store_referentiels(
            [
                "--repo-option",
                "JSON",
                "--to-file",
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

    # check that points are coherent
    assert_children_points_sum_to_parent_point(
        [
            ActionChildren(**action_children_as_dict)
            for action_children_as_dict in actions[referentiel]["children"]
        ],
        [
            ActionComputedPoint(**action_point_as_dict)
            for action_point_as_dict in actions[referentiel]["points"]
        ],
    )

    # check that computed points match the expectations
    points_by_id = {
        action_point_as_dict["action_id"]: action_point_as_dict["value"]
        for action_point_as_dict in actions[referentiel]["points"]
    }
    for action_id, expected_action_point in expected_points[referentiel].items():
        assert (
            points_by_id[action_id] == expected_action_point
        ), f"Expected {expected_action_point} points computed for {action_id}, got {points_by_id[action_id]}"


# Note : CRTE is not tested here, it requires having previously stored CAE indicateurs
