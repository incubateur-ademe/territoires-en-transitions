"""Générateur pour les indicateurs."""
import json
from typing import Callable, List

from bs4 import BeautifulSoup
from mistletoe import Document, HTMLRenderer
from mistletoe.block_token import BlockToken

from codegen.climat_pratic.thematiques_generator import get_thematiques
from codegen.utils.markdown_utils import void, is_yaml, is_keyword, is_heading, token_to_string, update_with_yaml
from codegen.utils.templates import build_jinja_environment


def meta(token: BlockToken, data: dict) -> None:
    """save ```yaml block"""
    return update_with_yaml(token, data)


def indicator_writer() -> Callable:
    """Returns a closure to keep track of current writer function. Also scope indicator related functions."""

    def head(token: BlockToken, indicator: dict) -> None:
        """save h1 into indicator"""
        if is_heading(token, 1):
            indicator['nom'] = token.children[0].content

    def description(token: BlockToken, indicator: dict) -> None:
        """Save description as an HTML string"""
        if is_keyword(token, 'description'):
            return
        if 'description' not in indicator.keys():
            indicator['description'] = ''
        indicator['description'] += token_to_string(token)

    current: Callable = head

    def writer(token: BlockToken, indicator: dict) -> None:
        nonlocal current
        if current is head and is_yaml(token):
            current = meta
        elif current is meta:
            current = void
        if is_keyword(token, 'description'):
            current = description
        current(token, indicator)

    return writer


def build_indicators(doc: Document) -> List[dict]:
    """Extract indicateurs from a markdown AST"""
    indicators = []
    writer = indicator_writer()

    for token in doc.children:
        if is_heading(token, 1):
            writer = indicator_writer()
            indicators.append({})
        if indicators:
            indicator = indicators[-1]
            writer(token, indicator)

    return indicators


def render_indicators_as_html(indicateurs: List[dict],
                              template_file='referentiels/html/indicateurs_citergie.j2') -> str:
    """Renders all indicators into a single html string"""
    env = build_jinja_environment()
    template = env.get_template(template_file)
    thematiques = get_thematiques()
    years = range(2016, 2023)
    by_thematique = {}
    renderer = HTMLRenderer()
    for indicateur in indicateurs:
        thematique = indicateur['climat_pratic_ids'][0]
        description = Document(indicateur['description'])
        indicateur['description'] = renderer.render(description)
        if thematique not in by_thematique.keys():
            by_thematique[thematique] = []
        by_thematique[thematique].append(indicateur)
    rendered = template.render(indicateurs=by_thematique, years=years, thematiques=thematiques)
    soup = BeautifulSoup(rendered, 'html.parser')
    return soup.prettify()


def render_indicators_as_json(indicators: List[dict]) -> str:  # pragma: no cover
    return json.dumps(indicators, indent=4)
