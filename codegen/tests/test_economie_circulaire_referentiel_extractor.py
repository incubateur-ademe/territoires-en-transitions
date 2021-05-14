from codegen.action.save import action_to_markdown
from codegen.economie_circulaire.referentiel_extractor import parse_referentiel_eci_xlsx


def test_parse_referentiel_eci_xlsx():
    """
    Test that some orientations are extracted from the xlsx
    and that their names are present in the generated markdown texts
    """
    orientations = parse_referentiel_eci_xlsx("../referentiels/sources/referentiel_eci_v3_v4_sobr.xlsx")
    assert orientations

    for orientation in orientations:
        markdown = action_to_markdown(orientation, 1)
        assert orientation['nom'] in markdown
