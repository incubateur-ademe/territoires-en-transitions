import glob
import os
from typing import List

from codegen.action.read import build_action
from codegen.action.render import render_actions_as_typescript
from codegen.utils.files import load_md
from codegen.utils.templates import escape_to_html, build_jinja_environment


def test_build_action_with_mesure():
    """Test that a specific mesure is parsed correctly"""
    md = load_md('../referentiels/markdown/mesures_citergie/1.1.1.md')
    mesure = build_action(md)
    assert mesure
    assert mesure['id'] == '1.1.1'
    assert mesure['nom'] == 'Définir la vision, les objectifs et la stratégie Climat-Air-Energie'
    assert len(mesure['description']) > 10
    assert len(mesure['actions']) == 7

    for action in mesure['actions']:
        assert str(action['id']).startswith(mesure['id'])
        assert len(action['nom']) > 10


def test_build_action_with_orientation():
    """Test that a specific orientation is parsed correctly"""
    md = load_md('../referentiels/markdown/orientations_economie_circulaire/1.1.md')
    orientation = build_action(md)
    assert orientation
    assert orientation['id'] == '1.1'
    assert orientation['nom'] == \
           'Définir une stratégie globale de la politique économie circulaire et assurer un portage politique fort'
    assert len(orientation['description']) > 10
    assert len(orientation['actions']) == 5

    for action in orientation['actions']:
        assert str(action['id']).startswith(orientation['id'])
        assert len(action['nom']) >= 10


def test_render_actions_as_typescript_with_mesures():
    """Test that all mesures are rendered correctly into typescript"""
    files = glob.glob(os.path.join('../referentiels/markdown/mesures_citergie', '*.md'))
    _render_actions_as_typescript(files)


def test_render_actions_as_typescript_with_orientations():
    """Test that all orientations are rendered correctly into typescript"""
    files = glob.glob(os.path.join('../referentiels/markdown/orientations_economie_circulaire', '*.md'))
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
    to_json = env.get_template('tests/single_value_to_json.j2')
    for action in actions:
        nom_json = to_json.render(value=action['nom'])
        assert escape_to_html(nom_json) in typescript
