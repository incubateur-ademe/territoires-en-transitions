from codegen.citergie.indicator_extractor import parse_indicators_xlsx, indicators_to_markdowns


def test_parse_xlsx():
    indicators = parse_indicators_xlsx(indicateurs='referentiels/sources/indicateurs_citergie.xlsx',
                                       correspondance='referentiels/sources/correspondance_citergie_climat_pratique.xlsx')
    assert len(indicators) > 100


def test_indicator_mds():
    indicators = parse_indicators_xlsx(indicateurs='referentiels/sources/indicateurs_citergie.xlsx',
                                       correspondance='referentiels/sources/correspondance_citergie_climat_pratique.xlsx')
    mds = indicators_to_markdowns(indicators)
    assert len(mds) == 65
