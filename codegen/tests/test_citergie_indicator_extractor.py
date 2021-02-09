from mistletoe import Document

from codegen.citergie.indicator_extractor import parse_indicators_xlsx, indicators_to_markdowns
from codegen.citergie.indicators_generator import render_indicators_as_html, build_indicators


def test_parse_xlsx():
    indicators = parse_indicators_xlsx(indicateurs='../referentiels/sources/indicateurs_citergie.xlsx',
                                       correspondance='../referentiels/sources/correspondance_citergie_climat_pratique.xlsx')
    assert len(indicators) > 100


def test_indicator_mds():
    indicators = parse_indicators_xlsx(indicateurs='../referentiels/sources/indicateurs_citergie.xlsx',
                                       correspondance='../referentiels/sources/correspondance_citergie_climat_pratique.xlsx')
    mds = indicators_to_markdowns(indicators)
    assert len(mds) == 65
    for md in mds.values():
        indicators = build_indicators(Document(md))
        html = render_indicators_as_html(indicators)
        assert html
