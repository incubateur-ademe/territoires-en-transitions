"""Fonctions pour générer les classes et les objets javascript"""
import json

import jsbeautifier

from codegen.utils.strings import camel_to_snake
from codegen.utils.templates import build_jinja_environment

class_template = 'shared/js/classes.j2'
object_template = 'shared/js/objects.j2'

env = build_jinja_environment()


def types_js(t: str) -> str:
    """Converts a type from yaml to a js type hint"""
    py_types = {'String': 'string', 'num': 'number', 'List': '[]', None: 'str'}
    if t in py_types.keys():
        return py_types[t]
    if t.startswith('List['):
        types = t.replace('List[', '').replace(']', '')
        params = ', '.join([types_js(t.strip()) for t in types.split(',')])
        return f'{params}[]'
    return t


def fields_js(yaml_data: dict) -> dict:
    """Transform yaml class fields."""
    return {name: types_js(properties['type']) for name, properties in yaml_data.items()}


def classes_js(yaml_data: dict) -> dict:
    """Transform yaml class declaration to be used by the js classes template."""
    return {name: fields_js(fields) for name, fields in yaml_data.items()}


def objects_js(yaml_data: dict) -> dict:
    """Transform yaml object declaration into template data."""
    return {name: json.dumps(obj, indent=4) for name, obj in yaml_data.items()}


def render_class(template_file: str, data: dict) -> str:
    template = env.get_template(template_file)
    classes = classes_js(data)
    rendered = template.render(classes=classes)
    return jsbeautifier.beautify(rendered)


def render_object(template_file: str, data: dict) -> str:
    template = env.get_template(template_file)
    objects = objects_js(data)
    rendered = template.render(objects=objects)
    return jsbeautifier.beautify(rendered)


def yaml_to_js(data: dict) -> tuple[str, str]:
    rendered = ''
    filename = ''

    if data:
        name = list(data.keys())[0]
        # this a class
        if name[0].isupper():
            filename = camel_to_snake(name)
            rendered = render_class(class_template, data)

        # this is an object.
        else:
            filename = camel_to_snake(name)
            rendered = render_object(object_template, data)

    return rendered, filename
