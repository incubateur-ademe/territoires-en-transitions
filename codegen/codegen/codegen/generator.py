"""Générateur pour les classes et les objets"""

from mistletoe import Document
from mistletoe.block_token import Heading, BlockToken

from codegen.utils.markdown_utils import void, is_heading, is_yaml, save_yaml_data


def comment(token: BlockToken, definition: dict) -> None:
    """Saves comments into definition"""
    line = ''
    if is_heading(token, 2):
        line = f'## ${token.children[0].content}'
    definition['comments'].append(line)


def parse_definitions(doc: Document) -> list[dict]:
    """Extract definitions from markdown AST"""
    definitions = []
    writer = void

    for token in doc.children:
        if is_heading(token, 2):
            definitions.append({
                'comments': [],
                'yaml': {},
            })
            writer = comment

        elif is_yaml(token):
            writer = save_yaml_data

        definition = definitions[-1] if definitions else None
        if definition:
            writer(token, definition)

    return definitions
