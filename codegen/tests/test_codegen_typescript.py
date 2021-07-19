from codegen.codegen.typescript import render_markdown_as_typescript
from codegen.utils.files import load_md


def test_render_markdown_as_typescript():
    md = load_md("definitions/shared/action_status.md")
    output = render_markdown_as_typescript(md)
    assert output
