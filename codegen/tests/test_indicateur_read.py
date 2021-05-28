from codegen.indicateur.read import indicateurs_builder
from codegen.utils.files import load_md


def test_build_indicators():
    """Test that a specific collection of indicators is parsed correctly"""
    md = load_md('../referentiels/markdown/indicateurs/cae_001.md')
    indicators = indicateurs_builder(md)
    assert len(indicators) == 10
