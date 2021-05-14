from mistletoe import Document

from codegen.action.read import build_action
from codegen.action.save import action_to_markdown
from codegen.economie_circulaire.referentiel_extractor import parse_referentiel_eci_xlsx


def test_parse_referentiel_eci_xlsx():
    """
    Test that some orientations are extracted from the xlsx
    and that the resulting markdown can be parsed back
    """
    orientations = parse_referentiel_eci_xlsx("../referentiels/sources/referentiel_eci_v3_v4_sobr.xlsx")
    assert orientations

    for orientation in orientations:
        markdown = action_to_markdown(orientation, 1)
        document = Document(markdown)
        action = build_action(document)
        assert action['nom'] == orientation['nom']
