"""Générateur pour les mesures, génère les exemples dans /generated/citergie."""
from __future__ import annotations

import json
import warnings
from typing import Callable, List

import jsbeautifier
from bs4 import BeautifulSoup
from mistletoe import Document, HTMLRenderer
from mistletoe.block_token import Heading, BlockToken, CodeFence

from codegen.climat_pratic.thematiques_generator import get_thematiques
from codegen.utils.markdown_utils import is_heading, is_keyword, token_to_string, update_with_yaml
from codegen.utils.templates import build_jinja_environment


def meta(token: BlockToken, data: dict) -> None:
    """save ```yaml block"""
    return update_with_yaml(token, data)


def empty_action() -> dict:
    """Returns an action dictionary with default fields"""
    return {
        'nom': '',
        'actions': [],
        'description': '',
    }


def actions_writer(name_level: int) -> Callable:
    """Returns a closure to keep track of current writer function. Also scope actions related functions."""

    def head(token: BlockToken, action: dict) -> None:
        """Save action header"""
        if isinstance(token, Heading) and token.level == name_level:
            action['nom'] = token.children[0].content

    def description(token: BlockToken, action: dict) -> None:
        """Save action description as an HTML string"""
        if is_keyword(token, 'description'):
            return
        action['description'] += token_to_string(token)

    current: Callable = head

    def writer(token: BlockToken, mesure: dict) -> None:
        """Save actions"""
        if is_keyword(token, 'actions'):  # Actions keyword is handled in the top parser
            return

        nest_level = name_level // 2
        action = parent = mesure

        for level in range(nest_level):
            # Build the tree.
            if not action['actions']:
                action['actions'].append(empty_action())
            parent = action
            # Select the last leaf of the last branch.
            action = action['actions'][-1]

        nonlocal current
        if is_heading(token, name_level):  # Got a title
            if action['nom']:  # action is already named
                action = empty_action()
                parent['actions'].append(action)
            current = head
        elif isinstance(token, CodeFence):
            current = meta
        elif current == meta:
            current = description

        current(token, action)

    return writer


def build_action(doc: Document) -> dict:
    """Extract an action from a mesure markdown AST"""
    mesure = empty_action()
    name_level = 1
    writer = actions_writer(name_level=name_level)

    for token in doc.children:
        if is_keyword(token, 'actions'):
            name_level = token.level + 1
            writer = actions_writer(name_level=name_level)
        if is_heading(token, level=name_level - 2):
            name_level -= 2
            writer = actions_writer(name_level=name_level)

        writer(token, mesure)

    return mesure


def relativize_ids(actions: List[dict], referentiel_slug: str) -> None:
    """Add path to actions in place"""
    for action in actions:
        if 'id' in action.keys():
            action['id_nomenclature'] = action['id']
            action['id'] = f'{referentiel_slug}__{action["id"]}'
        if 'actions' in action.keys():
            relativize_ids(action['actions'], referentiel_slug)

def clean_thematiques(actions: List[dict]) -> List:
    cleaned_actions = actions.copy()
    for action in cleaned_actions:
        theme = action['climat_pratic_id'].strip() if 'climat_pratic_id' in action.keys() else ''
        action['thematique_id'] = theme if theme else 'pas_de_theme'
    return cleaned_actions


def build_mesure(doc: Document) -> dict:
    """Extract mesures from markdown AST"""
    warnings.warn('use build_action instead', category=DeprecationWarning)
    return build_action(doc)


def render_actions_as_typescript(actions: List[dict],
                                 template_file='shared/ts/actions_referentiel.j2') -> str:
    """Render all actions into a single typescript file."""
    env = build_jinja_environment()
    template = env.get_template(template_file)
    rendered = template.render(actions=actions)
    return jsbeautifier.beautify(rendered)


def filter_indicateurs_by_mesure_id(indicateurs: List[dict], mesure_id: str) -> List[dict]:
    return [indicateur for indicateur in indicateurs if mesure_id in indicateur['mesures']]


def render_mesure_as_html(mesure: dict,
                          indicateurs: List[dict] = None,
                          template_file='referentiels/html/mesure_citergie.j2') -> str:
    env = build_jinja_environment()
    template = env.get_template(template_file)

    years = range(2016, 2023)

    if indicateurs is None:
        indicateurs = []

    # todo since those names are shared, use code generation.
    avancement_noms = {
        'faite': 'Faite',
        'programmee': 'Programmée',
        'pas_faite': 'Pas faite',
        'non_concernee': 'Non concernée',
    }
    renderer = HTMLRenderer()
    description = Document(mesure['description'])
    mesure['description'] = renderer.render(description)
    rendered = template.render(mesure=mesure, avancement_noms=avancement_noms, indicateurs=indicateurs, years=years)
    soup = BeautifulSoup(rendered, 'html.parser')
    return soup.prettify()


def render_mesures_summary_as_html(mesures: List[dict],
                                   template_file='referentiels/html/mesures_summary_citergie.j2') -> str:
    """Renders mesures summmary into a single html string"""
    env = build_jinja_environment()
    template = env.get_template(template_file)
    thematiques = get_thematiques()
    by_theme = {}

    for mesure in mesures:
        theme = mesure['climat_pratic_id'].strip() if 'climat_pratic_id' in mesure.keys() else ''
        theme = theme if theme else 'Pas de thème'
        if theme not in by_theme.keys():
            by_theme[theme] = []
        by_theme[theme].append(mesure)

    rendered = template.render(mesures=by_theme, thematiques=thematiques)
    soup = BeautifulSoup(rendered, 'html.parser')
    return soup.prettify()


def render_mesure_as_json(mesure: dict) -> str:  # pragma: no cover
    return json.dumps(mesure, indent=4)
