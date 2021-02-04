from codegen.citergie.generator import build_mesure
from codegen.utils import load_md


def test_build_mesure():
    """Test that a specific mesure is parsed correctly"""
    md = load_md('referentiels/extracted/citergie/1.1.1.md')
    mesure = build_mesure(md)
    assert mesure
    assert mesure['id'] == '1.1.1'
    assert mesure['nom'] == 'Définir la vision, les objectifs et la stratégie Climat-Air-Energie'
    assert len(mesure['description']) > 10
    assert len(mesure['actions']) == 7

    for action in mesure['actions']:
        assert str(action['id']).startswith(mesure['id'])
        assert len(action['nom']) > 10
