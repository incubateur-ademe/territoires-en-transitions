from mistletoe import Document

from codegen.citergie.indicator_extractor import parse_indicators_xlsx, indicators_to_markdowns_legacy
from codegen.citergie.indicators_generator import render_indicators_as_html, build_indicators


def test_parse_xlsx():
    indicators = parse_indicators_xlsx(indicateurs='../referentiels/sources/indicateurs_citergie.xlsx',
                                       correspondance='../referentiels/sources/correspondance_citergie_climat_pratique.xlsx')
    assert len(indicators) > 100


def test_indicator_mds_legacy():
    indicators = parse_indicators_xlsx(indicateurs='../referentiels/sources/indicateurs_citergie.xlsx',
                                       correspondance='../referentiels/sources/correspondance_citergie_climat_pratique.xlsx')
    mds = indicators_to_markdowns_legacy(indicators)
    assert len(mds) == 65
    for md in mds.values():
        build_indicators(Document(md))
        # later: pass indicators to regen
        # html = render_indicators_as_html(indicators)
        # assert html
