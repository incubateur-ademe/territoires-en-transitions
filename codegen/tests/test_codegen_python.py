from codegen.codegen.python import types_python, render_markdown_as_python
from codegen.utils.files import load_md


def test_render_markdown_as_python():
    md = load_md("definitions/shared/action_status.md")
    output = render_markdown_as_python(md)
    assert output


def test_str_literal_without_options():
    actual_literal = types_python(type="String")
    assert actual_literal == "str"


def test_str_literal():
    actual_literal = types_python(type="String", options=["a", "b", "c"])
    assert actual_literal == "Literal['a', 'b', 'c']"
