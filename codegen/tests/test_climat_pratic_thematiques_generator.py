from codegen.climat_pratic.thematiques_generator import build_thematiques, render_thematiques_as_typescript
from codegen.utils.files import load_md
from codegen.utils.templates import escape_to_html


def test_build_thematiques() -> None:
    """Test that thématique markdown file is parsed"""
    markdown = load_md('../referentiels/markdown/thematiques_climat_pratic/thematiques.md')
    thematiques = build_thematiques(markdown)
    assert 'strategie' in thematiques.keys()
    assert 'Stratégie' in thematiques.items()


def test_render_thematiques_as_typescript() -> None:
    """Test that parsed thématiques renders as TypeScript"""
    markdown = load_md('../referentiels/markdown/thematiques_climat_pratic/thematiques.md')
    thematiques = build_thematiques(markdown)
    rendered = render_thematiques_as_typescript(thematiques)

    for id, name in thematiques.items():
        assert id in rendered
        assert name in rendered
