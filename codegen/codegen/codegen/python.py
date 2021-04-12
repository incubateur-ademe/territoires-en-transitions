"""Fonctions pour générer les classes et les objets python"""
from typing import List

from black import format_str, FileMode
from mistletoe import Document

from codegen.codegen.generator import parse_definitions
from codegen.utils.strings import camel_to_snake
from codegen.utils.templates import build_jinja_environment

template_file = 'shared/python/classes.j2'

env = build_jinja_environment()


def types_python(t: str) -> str:
    """Converts a type from yaml to a python type"""
    py_types = {'String': 'str', 'num': 'float', 'List': 'list', 'Date': 'date', None: 'str'}
    if t in py_types.keys():
        return py_types[t]
    if t.startswith('List['):
        types = t.replace('List[', '').replace(']', '')
        params = ', '.join([types_python(t.strip()) for t in types.split(',')])
        return f'List[{params}]'
    return t


def fields_python(yaml_data: dict) -> dict:
    """Transform yaml class fields."""
    return {name: types_python(properties['type']) for name, properties in yaml_data.items()}


def classes_python(yaml_data: dict) -> dict:
    """Transform yaml class declaration into data suitable for the python classes template."""
    return {name: fields_python(fields) for name, fields in yaml_data.items()}


def render_template(template_file: str, data: dict) -> str:
    template = env.get_template(template_file)
    classes = classes_python(data)
    rendered = template.render(classes=classes)
    return format_str(rendered, mode=FileMode())


def yaml_to_python(definition: dict) -> tuple[str, str]:
    rendered = ''
    filename = ''

    data = definition['yaml']

    if data:
        name = list(data.keys())[0]

        if name[0].isupper():
            filename = camel_to_snake(name)
            rendered = render_template(template_file, data)

    return f'{filename}.py', rendered


def render_markdown_as_python(markdown: Document) -> List[tuple[str, str]]:
    parsed = parse_definitions(markdown)
    return [yaml_to_python(definition) for definition in parsed]
