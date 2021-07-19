from codegen.codegen.python import render_markdown_as_python
from codegen.utils.files import load_md


def test_render_markdown_as_python():
    md = load_md("definitions/shared/action_status.md")
    output = render_markdown_as_python(md)
    assert output
