from codegen.economie_circulaire.referentiel_extractor import parse_referentiel_eci_xlsx


def test_parse_referentiel_eci_xlsx():
    actions = parse_referentiel_eci_xlsx("../referentiels/sources/referentiel_eci_v3_v4_sobr.xlsx")
    assert actions
