import glob
import os

from codegen.citergie.mesures_generator import build_mesure, render_mesure_as_html, render_mesures_summary_as_html
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
    md = load_md('../referentiels/markdown/mesures_citergie/1.1.1.md')
    mesure = build_mesure(md)
    html = render_mesure_as_html(mesure)

    assert html


def test_render_mesure_as_html_all():
    """Test that all mesures are rendered correctly"""
    files = glob.glob(os.path.join('../referentiels/markdown/mesures_citergie', '*.md'))
    assert files

    for file in files:
        md = load_md(file)
        mesure = build_mesure(md)
        html = render_mesure_as_html(mesure)

        assert escape_to_html(mesure['nom']) in html

        if 'actions' in mesure.keys():
            for action in mesure['actions']:
                assert escape_to_html(action['nom']) in html


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
