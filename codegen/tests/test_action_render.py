import glob
import os
from typing import List

from codegen.action.read import build_action
from codegen.action.render import render_actions_as_typescript
from codegen.utils.files import load_md
from codegen.utils.templates import escape_to_html, build_jinja_environment


def test_build_action_with_mesure():
    """Test that a specific mesure is parsed correctly"""
    md = load_md("tests/md/exemple_citergie_1.1.1.md")
    mesure = build_action(md)
    assert mesure
    assert mesure["id"] == "1.1.1"

    assert (
        mesure["nom"]
        == "Définir la vision, les objectifs et la stratégie Climat-Air-Energie"
    )

    assert mesure["description"] == "Description de 1.1.1\n\n"
    assert (
        mesure["ressources"]
        == '<a href="http://www.ademe.fr/reference">Une référence</a>\n\n'
    )
    assert (
        mesure["contexte"]
        == "**Un titre**\n\nLes baleines.\n\n**Réglementation**\n\nLa Loi dit\n\n- qu'il faut faire ça,\n\n- et aussi ceci,\n\n"
    )
    assert (
        mesure["exemples"]
        == "**Exemple 1**\n\nVoilà par exemple.\n\n**Exemple 2**\n\nOu bien comme ça.\n\n"
    )
    actions = mesure["actions"]
    assert len(actions) == 3
    assert [action["id"] for action in actions] == ["1.1.1.1", "1.1.1.2", "1.1.1.3"]
    assert [action["nom"] for action in actions] == ["Tache 1", "Tache 2", "Tache 3"]


def test_build_action_with_orientation():
    """Test that a specific orientation is parsed correctly"""
    md = load_md("../referentiels/markdown/orientations_economie_circulaire/1.1.md")
    orientation = build_action(md)
    assert orientation
    assert orientation["id"] == "1.1"
    assert (
        orientation["nom"]
        == "Définir une stratégie globale de la politique Economie Circulaire et assurer un portage politique fort"
    )
    assert len(orientation["description"]) > 10
    assert len(orientation["actions"]) == 5

    for action in orientation["actions"]:
        assert str(action["id"]).startswith(orientation["id"])
        assert len(action["nom"]) >= 10


def test_render_actions_as_typescript_with_mesures():
    """Test that all mesures are rendered correctly into typescript"""
    files = glob.glob(os.path.join("../referentiels/markdown/mesures_citergie", "*.md"))
    _render_actions_as_typescript(files)


def test_render_actions_as_typescript_with_orientations():
    """Test that all orientations are rendered correctly into typescript"""
    files = glob.glob(
        os.path.join(
            "../referentiels/markdown/orientations_economie_circulaire", "*.md"
        )
    )
    _render_actions_as_typescript(files)


def _render_actions_as_typescript(files: List[str]) -> None:
    assert files
    actions = []

    for file in files:
        md = load_md(file)
        action = build_action(md)
        actions.append(action)

    typescript = render_actions_as_typescript(actions)

    env = build_jinja_environment()
    to_json = env.get_template("tests/single_value_to_json.j2")
    for action in actions:
        nom_json = to_json.render(value=action["nom"])
        assert escape_to_html(nom_json) in typescript
