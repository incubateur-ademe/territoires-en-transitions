from pathlib import Path
import json

from business.adapters.json_referentiel_repo import JsonReferentielRepository
from tests.utils.referentiel_factory import (
    make_action_children,
    make_action_definition,
    make_action_points,
)


def delete_file(path: Path):
    try:
        path.unlink()
    except FileNotFoundError:
        pass


def test_can_add_to_repo():
    path = Path("./tests/data/tmp/ref.json")
    delete_file(path)

    repo = JsonReferentielRepository(path)

    definition_entities = [
        make_action_definition(action_id="eci"),
        make_action_definition(action_id="eci_1"),
    ]
    points_entities = [
        make_action_points(action_id="eci", points=10),
        make_action_points(action_id="eci_1", points=10),
    ]
    children_entities = [
        make_action_children(action_id="eci", children_ids=["eci_1"]),
        make_action_children(action_id="eci_1", children_ids=[]),
    ]
    repo.add_referentiel(definition_entities, children_entities, points_entities)

    with open(path, "r") as f:
        serialized_referentiel = json.load(f)

    assert "eci" in serialized_referentiel
    assert len(serialized_referentiel["eci"]["definitions"]) == 2
    assert len(serialized_referentiel["eci"]["children"]) == 2
    assert len(serialized_referentiel["eci"]["points"]) == 2


def test_retrieve_from_json():
    path = Path("./tests/data/example_referentiel.json")
    repo = JsonReferentielRepository(path)
    assert "eci" in repo.referentiels
    assert len(repo.referentiels["eci"].definitions) == 2
    assert len(repo.referentiels["eci"].children) == 2
    assert len(repo.referentiels["eci"].points) == 2
