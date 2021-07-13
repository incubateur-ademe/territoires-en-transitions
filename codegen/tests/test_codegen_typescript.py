from codegen.codegen.typescript import render_markdown_as_typescript, types_ts
from codegen.utils.files import load_md


def test_render_markdown_as_typescript():
    md = load_md("definitions/shared/action_status.md")
    output = render_markdown_as_typescript(md)
    assert output


def test_str_literal_without_options():
    actual_literal = types_ts(type="String")
    assert actual_literal == "String"


def test_str_literal_with_options():
    actual_literal = types_ts(type="String", options=["a", "b", "c"])
    assert actual_literal == "'a'|'b'|'c'"
