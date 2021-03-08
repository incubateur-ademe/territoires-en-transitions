import glob
import os

from codegen.codegen.generator import parse_definitions
from codegen.utils.files import load_md


def test_parse_definitions():
    """Test that one example is parsed correctly"""
    md = load_md('definitions/shared/action_status.md')
    definitions = parse_definitions(md)
    assert definitions
    assert len(definitions) == 2
    for definition in definitions:
        assert isinstance(definition['yaml'], dict)


def test_parse_all_definitions():
    """Test that all definition files are not breaking"""
    files = glob.glob(os.path.join('definitions/shared', '*.md'))
    for filename in files:
        md = load_md(filename)
        definitions = parse_definitions(md)
        assert definitions
        for definition in definitions:
            assert isinstance(definition['yaml'], dict)
