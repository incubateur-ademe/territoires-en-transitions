"""Générateur pour les mesures, génère les exemples dans /generated/citergie."""
import json
import os
from typing import Callable

import jsbeautifier
import yaml
from bs4 import BeautifulSoup
from mistletoe import Document, HTMLRenderer
from mistletoe.block_token import Heading, BlockToken, CodeFence

from codegen.utils import write, build_jinja_environment

env = build_jinja_environment()
template_js = 'referentiels/js/mesure_citergie.j2'
template_html = 'referentiels/html/mesure_citergie.j2'


def is_keyword(token: BlockToken, keyword: str) -> bool:
    """Returns True if token is a reserved keyword."""
    return isinstance(token, Heading) and str(token.children[0].content).lower().startswith(keyword.lower())


def is_yaml(token: BlockToken) -> bool:
    """Returns True if token is a yaml blockquote"""
    return isinstance(token, CodeFence) and token.language == 'yaml'


def is_heading(token: BlockToken, level: int) -> bool:
    """Returns True if token is a reserved keyword."""
    return isinstance(token, Heading) and token.level == level


# writers functions
def void(token: BlockToken, mesure: dict) -> None:
    """Does nothing"""
    pass


def meta(token: BlockToken, data: dict) -> None:
    """save ```yaml block"""
    if is_yaml(token):
        parsed = yaml.safe_load(token.children[0].content)
        data.update(parsed)


def actions_writer() -> Callable:
    """Returns a closure to keep track of current writer function. Also scope actions related functions."""

    def head(token: BlockToken, action: dict) -> None:
        """Save action h3"""
        if isinstance(token, Heading) and token.level == 3:
            action['nom'] = token.children[0].content

    def description(token: BlockToken, action: dict) -> None:
        """Save action description as an HTML string"""
        if is_keyword(token, 'description'):
            return
        if 'description' not in action.keys():
            action['description'] = ''
        with HTMLRenderer() as renderer:
            action['description'] += renderer.render(token)

    current: Callable = head

    def writer(token: BlockToken, mesure: dict) -> None:
        """Save actions"""
        if is_keyword(token, 'actions'):
            return
        if 'actions' not in mesure.keys():
            mesure['actions'] = [{}]
        actions: list = mesure['actions']
        action: dict = actions[-1]

        nonlocal current
        if action:
            if is_heading(token, 3):
                action = {}
                actions.append(action)
                current = head
            elif isinstance(token, CodeFence):
                current = meta
            elif current == meta:
                current = description

        current(token, action)

    return writer


def mesure_writer() -> Callable:
    """Returns a closure to keep track of current writer function. Also scope mesure related functions."""

    def head(token: BlockToken, mesure: dict) -> None:
        """save h1 into mesure"""
        if isinstance(token, Heading) and token.level == 1:
            mesure['nom'] = token.children[0].content

    def description(token: BlockToken, mesure: dict) -> None:
        """Save description as an HTML string"""
        if is_keyword(token, 'description'):
            return
        if 'description' not in mesure.keys():
            mesure['description'] = ''
        with HTMLRenderer() as renderer:
            mesure['description'] += renderer.render(token)

    actions = actions_writer()

    current: Callable = head

    def writer(token: BlockToken, mesure: dict) -> None:
        nonlocal current
        if current is head and is_yaml(token):
            current = meta
        elif current is meta:
            current = void
        if is_keyword(token, 'description'):
            current = description
        if is_keyword(token, 'actions'):
            current = actions
        current(token, mesure)

    return writer


def build_mesure(doc: Document) -> dict:
    """Extract mesures from markdown AST"""
    mesure = {}
    writer = mesure_writer()

    for token in doc.children:
        writer(token, mesure)

    return mesure


def render_js(template_file: str, mesure: dict) -> str:
    template = env.get_template(template_file)
    rendered = template.render(mesure=mesure)
    return jsbeautifier.beautify(rendered)


def render_html(template_file: str, mesure: dict) -> str:
    template = env.get_template(template_file)
    rendered = template.render(mesure=mesure)
    soup = BeautifulSoup(rendered, 'html.parser')
    return soup.prettify()


def render_json(mesure: dict) -> str:
    return json.dumps(mesure, indent=4)


def write_citergie_outputs(data: Document, output_dir: str, json: bool, js: bool, html: bool) -> None:
    mesure = build_mesure(data)
    filename_base = f"mesure_{mesure['id']}"

    if json:
        json_data = render_json(mesure)
        filename = os.path.join(output_dir, 'json', f'{filename_base}.json')
        write(filename, json_data)

    if js:
        javascript = render_js(template_js, mesure)
        filename = os.path.join(output_dir, 'js', f'{filename_base}.mjs')
        write(filename, javascript)

    if html:
        html_doc = render_html(template_html, mesure)
        filename = os.path.join(output_dir, 'html', f'{filename_base}.html')
        write(filename, html_doc)
