import pytest

from codegen.citergie.extractor import load_docx, parse_docx


@pytest.fixture
def mesures() -> list:
    document = load_docx('../referentiels/sources/citergie.docx')
    return parse_docx(document)


def test_parse_docx(mesures):
    """Test that the source docx is parsed"""
    assert len(mesures) == 65
    for mesure in mesures:
        assert mesure['id']
