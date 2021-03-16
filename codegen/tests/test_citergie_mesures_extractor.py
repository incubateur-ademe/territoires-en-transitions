import pytest
from mistletoe import Document

from codegen.citergie.mesures_extractor import docx_to_mesures, add_climat_pratic, mesure_to_markdown_legacy
from codegen.citergie.mesures_generator import build_mesure
from codegen.utils.files import load_docx


@pytest.fixture
def mesures() -> list:
    document = load_docx('../referentiels/sources/citergie.docx')
    mesures = docx_to_mesures(document)
    return add_climat_pratic(mesures, '../referentiels/sources/correspondance_citergie_climat_pratique.xlsx')


def test_parse_docx_legacy(mesures):
    """Test that the source docx is parsed and can be used to generate parsable markdown"""
    assert len(mesures) == 65
    for mesure in mesures:
        assert mesure['id']
        md = mesure_to_markdown_legacy(mesure)
        doc = Document(md)
        parsed = build_mesure(doc)
        assert parsed['nom'] == mesure['nom']
        assert parsed['id'] == mesure['id']
