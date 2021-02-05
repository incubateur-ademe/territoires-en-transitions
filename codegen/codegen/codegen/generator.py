"""Générateur pour les classes et les objets"""
import os

from mistletoe import Document
from mistletoe.block_token import Heading, BlockToken

from codegen.codegen.javascript import yaml_to_js
from codegen.codegen.python import yaml_to_python
from codegen.utils.files import write
from codegen.utils.markdown_utils import void, is_heading, is_yaml, save_yaml_data


def comment(token: BlockToken, definition: dict) -> None:
    """Saves comments into definition"""
    line = ''
    if token is Heading:
        line = token.children[0].content
    definition['comments'] += f'{line}\n'


def parse_definitions(doc: Document) -> list[dict]:
    """Extract definitions from markdown AST"""
    definitions = []
    writer = void

    for token in doc.children:
        if is_heading(token, 2):
            definitions.append({
                'comments': '',
                'yaml': {},
            })
            writer = comment

        elif is_yaml(token):
            writer = save_yaml_data

        definition = definitions[-1] if definitions else None
        if definition:
            writer(token, definition)

    return definitions


def write_outputs(data: Document, directory: str, python=True, js=True) -> None:
    definitions = parse_definitions(data)

    for definition in definitions:
        if python:
            contents, filename = yaml_to_python(definition['yaml'])
            if filename:
                filename = os.path.join(directory, 'python', f'{filename}.py')
                write(filename, contents)

        if js:
            contents, filename = yaml_to_js(definition['yaml'])
            if filename:
                filename = os.path.join(directory, 'js', f'{filename}.js')
                write(filename, contents)
