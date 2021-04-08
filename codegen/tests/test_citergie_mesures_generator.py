import glob
import os

from codegen.citergie.indicators_generator import build_indicators
from codegen.citergie.mesures_generator import build_mesure, render_mesure_as_html, render_mesures_summary_as_html, \
    filter_indicateurs_by_mesure_id, build_action, render_actions_as_typescript
from codegen.utils.files import load_md
from codegen.utils.templates import escape_to_html


def test_build_mesure():
    """Test that a specific mesure is parsed correctly"""
    md = load_md('../referentiels/markdown/mesures_citergie/1.1.1.md')
    mesure = build_mesure(md)
    assert mesure
    assert mesure['id'] == '1.1.1'
    assert mesure['nom'] == 'Définir la vision, les objectifs et la stratégie Climat-Air-Energie'
    assert len(mesure['description']) > 10
    assert len(mesure['actions']) == 7

    for action in mesure['actions']:
        assert str(action['id']).startswith(mesure['id'])
        assert len(action['nom']) > 10


def test_render_mesure_as_html():
    """Test that a specific mesure is rendered"""
    indicateur_md = load_md('../referentiels/markdown/indicateurs_citergie/1.md')
    indicateurs = build_indicators(indicateur_md)

    mesure_md = load_md('../referentiels/markdown/mesures_citergie/1.1.1.md')
    mesure = build_mesure(mesure_md)

    mesure_indicateurs = filter_indicateurs_by_mesure_id(indicateurs, mesure['id'])
    html = render_mesure_as_html(mesure, indicateurs=mesure_indicateurs)

    assert html


def test_render_mesure_as_html_all():
    """Test that all mesures are rendered correctly"""
    indicateur_files = glob.glob(os.path.join('../referentiels/markdown/indicateurs_citergie', '*.md'))
    indicateurs = []
    for indicateur_file in indicateur_files:
        md = load_md(indicateur_file)
        indicateurs.extend(build_indicators(md))

    mesure_files = glob.glob(os.path.join('../referentiels/markdown/mesures_citergie', '*.md'))
    assert mesure_files

    for file in mesure_files:
        md = load_md(file)
        mesure = build_mesure(md)
        mesure_indicateurs = filter_indicateurs_by_mesure_id(indicateurs, mesure['id'])
        html = render_mesure_as_html(mesure, indicateurs=mesure_indicateurs)

        assert escape_to_html(mesure['nom']) in html

        if 'actions' in mesure.keys():
            for action in mesure['actions']:
                assert escape_to_html(action['nom']) in html

        if mesure_indicateurs:
            for indicateur in mesure_indicateurs:
                assert escape_to_html(indicateur['nom']) in html


def test_render_mesures_summary_as_html():
    """Test that all mesures are rendered correctly into the summary"""
    files = glob.glob(os.path.join('../referentiels/markdown/mesures_citergie', '*.md'))
    assert files
    mesures = []

    for file in files:
        md = load_md(file)
        mesure = build_mesure(md)
        mesures.append(mesure)
    html = render_mesures_summary_as_html(mesures)

    for mesure in mesures:
        assert escape_to_html(mesure['nom']) in html


def test_render_actions_as_typescript():
    """Test that all mesures are rendered correctly into typescript"""
    files = glob.glob(os.path.join('../referentiels/markdown/mesures_citergie', '*.md'))
    assert files
    actions = []

    for file in files:
        md = load_md(file)
        action = build_action(md)
        actions.append(action)

    typescript = render_actions_as_typescript(actions)

    for action in actions:
        assert escape_to_html(action['nom']) in typescript
