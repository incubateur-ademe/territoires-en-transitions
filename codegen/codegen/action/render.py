import json
from typing import List

import jsbeautifier
from bs4 import BeautifulSoup
from mistletoe import HTMLRenderer, Document

from codegen.climat_pratic.thematiques_generator import get_thematiques
from codegen.utils.templates import build_jinja_environment


def render_actions_as_typescript(actions: List[dict],
                                 template_file='shared/ts/actions_referentiel.j2') -> str:
    """Render all actions into a single typescript file."""
    env = build_jinja_environment()
    renderer = HTMLRenderer()

    def render_descriptions(actions: List[dict]) -> None:
        for action in actions:
            if action['description']:
                description = Document(action['description'])
                action['description'] = renderer.render(description)
            render_descriptions(action['actions'])

    render_descriptions(actions)

    template = env.get_template(template_file)
    rendered = template.render(actions=actions)
    return jsbeautifier.beautify(rendered)


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
        'programmee': 'Prévue',
        'en_cours': 'En cours',
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
