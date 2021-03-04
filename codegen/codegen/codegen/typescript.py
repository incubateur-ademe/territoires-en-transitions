"""Fonctions pour générer les classes et les objets javascript"""
import json
from typing import List

import jsbeautifier
from mistletoe import Document

from codegen.codegen.generator import parse_definitions
from codegen.utils.strings import camel_to_snake
from codegen.utils.templates import build_jinja_environment


def types_ts(t: str) -> str:
    """Converts a type from yaml to a js type hint"""
    py_types = {'String': 'string', 'num': 'number', 'List': '[]', None: 'string'}
    if t in py_types.keys():
        return py_types[t]
    if t.startswith('List['):
        types = t.replace('List[', '').replace(']', '')
        params = ', '.join([types_ts(t.strip()) for t in types.split(',')])
        return f'{params}[]'
    return t


def fields_ts(yaml_data: dict) -> dict:
    """Transform yaml class fields."""
    return {name: types_ts(properties['type']) for name, properties in yaml_data.items()}


def classes_ts(yaml_data: dict) -> dict:
    """Transform yaml class declaration to be used by the js classes template."""
    return {name: fields_ts(fields) for name, fields in yaml_data.items()}


def objects_ts(yaml_data: dict) -> dict:
    """Transform yaml object declaration into template data."""
    return {name: json.dumps(obj, indent=4) for name, obj in yaml_data.items()}


def render_classes(definition: dict, pathname: str, template_file='shared/ts/classes.j2') -> str:
    env = build_jinja_environment()
    template = env.get_template(template_file)
    classes = classes_ts(definition['yaml'])
    rendered = template.render(classes=classes, comments=definition['comments'], pathname=pathname)
    return jsbeautifier.beautify(rendered)


def render_object(definition: dict, template_file='shared/ts/objects.j2') -> str:
    env = build_jinja_environment()
    template = env.get_template(template_file)
    objects = objects_ts(definition['yaml'])
    rendered = template.render(objects=objects, comments=definition['comments'])
    return jsbeautifier.beautify(rendered)


def yaml_to_ts(definition: dict) -> tuple[str, str]:
    rendered = ''
    filename = ''
    data = definition['yaml']

    if data:
        name = list(data.keys())[0]
        filename = camel_to_snake(name)

        # this a class
        if name[0].isupper():
            rendered = render_classes(definition, filename)

        # this is an object.
        else:
            rendered = render_object(definition)

    return f'{filename}.ts', rendered


def render_markdown_as_typescript(markdown: Document) -> List[tuple[str, str]]:
    parsed = parse_definitions(markdown)
    return [yaml_to_ts(definition) for definition in parsed]
