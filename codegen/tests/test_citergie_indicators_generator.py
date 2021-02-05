import glob
import os

from bs4 import BeautifulSoup

from codegen.citergie.indicators_generator import build_indicators, render_indicators_as_html
from codegen.utils.files import load_md


def test_build_indicators():
    """Test that a specific collection of indicators is parsed correctly"""
    md = load_md('referentiels/extracted/indicateurs_citergie/1.md')
    indicators = build_indicators(md)
    assert len(indicators) == 9


def test_render_indicators_as_html():
    """Test html rendering"""
    md = load_md('referentiels/extracted/indicateurs_citergie/1.md')
    indicators = build_indicators(md)
    html = render_indicators_as_html(indicators)
    assert html


def test_render_indicators_as_html_all():
    """Test html rendering on all indicators"""
    files = glob.glob(os.path.join('referentiels/extracted/indicateurs_citergie', '*.md'))
    assert files

    indicators = []
    for filename in files:
        md = load_md(filename)
        indicators.extend(build_indicators(md))
    html = render_indicators_as_html(indicators)
    assert html

    for indicator in indicators:
        soup = BeautifulSoup(indicator['nom'], 'html.parser')
        nom = soup.prettify().replace('\n', '')
        assert nom in html
