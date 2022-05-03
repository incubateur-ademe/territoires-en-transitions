from pathlib import Path
import json

from business.referentiel.adapters.json_referentiel_repo import (
    JsonReferentielRepository,
)
from business.referentiel.domain.models.action_relation import ActionRelation
from business.utils.action_id import ActionId
from tests.utils.referentiel_factory import (
    make_action_children,
    make_action_definition,
    make_action_points,
    make_indicateur,
)
from tests.utils.files import remove_file, mkdir


def test_can_add_actions_to_repo():
    path = Path("./tests/data/tmp/ref.json")
    mkdir(path.parent)
    remove_file(path)

    repo = JsonReferentielRepository(path)

    definition_entities = [
        make_action_definition(action_id="eci"),
        make_action_definition(action_id="eci_1"),
    ]
    points_entities = [
        make_action_points(action_id="eci", points=10),
        make_action_points(action_id="eci_1", points=10),
    ]
    children_relations = [
        ActionRelation("eci", ActionId("eci"), None),
        ActionRelation("eci", ActionId("eci_1"), ActionId("eci")),
    ]
    repo.add_referentiel_actions(
        definition_entities, children_relations, points_entities
    )

    with open(path, "r") as f:
        serialized_repo = json.load(f)

    assert "actions" in serialized_repo
    serialized_actions = serialized_repo["actions"]
    assert "eci" in serialized_actions
    assert len(serialized_actions["eci"]["definitions"]) == 2
    assert len(serialized_actions["eci"]["children"]) == 1
    assert len(serialized_actions["eci"]["points"]) == 2


def test_can_add_indicateurs_to_repo():
    path = Path("./tests/data/tmp/ref.json")
    mkdir(path.parent)
    remove_file(path)

    repo = JsonReferentielRepository(path)

    indicateur_entities = [
        make_indicateur(indicateur_id="eci-12"),
    ]

    repo.upsert_indicateurs(indicateur_entities)

    with open(path, "r") as f:
        serialized_repo = json.load(f)

    assert "indicateurs" in serialized_repo
    assert len(serialized_repo["indicateurs"]) == 1


def test_retrieve_from_json():
    path = Path("./tests/data/example_referentiel.json")
    repo = JsonReferentielRepository(path)
    assert "eci" in repo._actions_by_ref
    assert len(repo._actions_by_ref["eci"].definitions) == 2
    assert len(repo._actions_by_ref["eci"].children) == 2
    assert len(repo._actions_by_ref["eci"].points) == 2

    assert len(repo._indicateurs) == 1
