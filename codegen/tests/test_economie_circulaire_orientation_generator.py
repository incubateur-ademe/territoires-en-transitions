from codegen.citergie.mesures_generator import render_mesure_as_html
from codegen.economie_circulaire.orientations_generator import build_orientation, orientation_as_mesure
from codegen.utils.files import load_md, sorted_files


def test_build_orientation():
    """Test that a specific orientation is parsed correctly"""
    md = load_md('../referentiels/markdown/orientations_economie_circulaire/1.1.md')
    orientation = build_orientation(md)
    assert orientation
    assert orientation['id'] == 1.1


def test_orientation_as_mesure():
    """Test that a specific orientation can be rendered as a mesure"""
    md = load_md('../referentiels/markdown/orientations_economie_circulaire/1.1.md')
    orientation = build_orientation(md)
    mesure = orientation_as_mesure(orientation)

    html = render_mesure_as_html(mesure, indicateurs=[])

    assert html


def test_orientation_as_mesure_all():
    """Test that all specific orientations can be rendered as mesure"""
    files = sorted_files('../referentiels/markdown/orientations_economie_circulaire', 'md')

    for file in files:
        md = load_md(file)
        orientation = build_orientation(md)
        mesure = orientation_as_mesure(orientation)
        html = render_mesure_as_html(mesure, indicateurs=[])
        assert html
