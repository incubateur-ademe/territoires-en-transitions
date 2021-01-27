import os
import re

import yaml
from jinja2 import Environment, PackageLoader, select_autoescape
from mistletoe import Document


def load_md(filename: str) -> Document:
    """Load a markdown file"""
    with open(filename, 'r', encoding='utf8') as file:
        return Document(file)


def load_yaml(filename: str) -> dict:
    """Load a yaml file"""
    with open(filename, 'r') as file:
        return yaml.full_load(file)


def write(filename: str, contents: str) -> None:
    """Write a file, create parent directories if needed"""
    try:
        os.makedirs(os.path.dirname(filename), exist_ok=True)
    except OSError:
        pass
    with open(filename, 'w', encoding='utf8') as file:
        file.write(contents)


def camel_to_snake(name: str) -> str:
    """Camel case to snake case"""
    name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()


def build_jinja_environment() -> Environment:
    return Environment(
        loader=PackageLoader('codegen', '../templates'),
        autoescape=select_autoescape(
            disabled_extensions=('j2',),
        )
    )
