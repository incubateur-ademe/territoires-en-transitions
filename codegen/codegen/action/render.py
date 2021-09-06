import json
from typing import List, Literal

import jsbeautifier
from black import format_str, FileMode
from bs4 import BeautifulSoup
from mistletoe import HTMLRenderer, Document

from codegen.climat_pratic.thematiques_generator import get_thematiques
from codegen.utils.templates import build_jinja_environment


def render_field_text_to_html(
    actions: List[dict],
    field: Literal["description", "contexte", "exemples", "ressources"],
):
    """Renders descriptions markdown to html. Convert description in place."""
    renderer = HTMLRenderer()

    def recursively_render(actions: List[dict]) -> None:
        for action in actions:
            if action[field]:
                description = Document(action[field])
                action[field] = renderer.render(description)
            recursively_render(action["actions"])

    recursively_render(actions)


def add_points(actions: List[dict]):
    """Add missing points"""
    for action in actions:
        action["points"] = action.get("points", -1.0)
        add_points(action["actions"])


def render_actions_as_python(
    actions: List[dict], template_file="shared/python/actions_referentiel.j2"
) -> str:
    """Render all actions into a single python file."""
    env = build_jinja_environment()

    def add_points(actions: List[dict]):
        for action in actions:
            action["points"] = action.get("points", None)
            add_points(action["actions"])

    add_points(actions)
    template = env.get_template(template_file)
    rendered = template.render(actions=actions)
    return format_str(rendered, mode=FileMode())


def render_actions_as_typescript(
    actions: List[dict], template_file="shared/ts/actions_referentiel.j2"
) -> str:
    """Render all actions into a single typescript file."""
    env = build_jinja_environment()

    add_points(actions)

    render_field_text_to_html(actions, "description")
    render_field_text_to_html(actions, "contexte")
    render_field_text_to_html(actions, "exemples")
    render_field_text_to_html(actions, "ressources")

    template = env.get_template(template_file)
    rendered = template.render(actions=actions)
    return jsbeautifier.beautify(rendered)


def render_mesure_as_html(
    mesure: dict,
    indicateurs: List[dict] = None,
    template_file="referentiels/html/mesure_citergie.j2",
) -> str:
    env = build_jinja_environment()
    template = env.get_template(template_file)

    years = range(2016, 2023)

    if indicateurs is None:
        indicateurs = []

    # TODO /!\ This should not be hard-coded here, since it is defined elsewhere /!\
    avancement_noms = {
        "faite": "Faite",
        "programmee": "Prévue",
        "en_cours": "En cours",
        "pas_faite": "Pas faite",
        "non_concernee": "Non concernée",
    }
    renderer = HTMLRenderer()
    description = Document(mesure["description"])
    mesure["description"] = renderer.render(description)
    rendered = template.render(
        mesure=mesure,
        avancement_noms=avancement_noms,
        indicateurs=indicateurs,
        years=years,
    )
    soup = BeautifulSoup(rendered, "html.parser")
    return soup.prettify()


def render_mesures_summary_as_html(
    mesures: List[dict], template_file="referentiels/html/mesures_summary_citergie.j2"
) -> str:
    """Renders mesures summmary into a single html string"""
    env = build_jinja_environment()
    template = env.get_template(template_file)
    thematiques = get_thematiques()
    by_theme = {}

    for mesure in mesures:
        theme = (
            mesure["climat_pratic_id"].strip()
            if "climat_pratic_id" in mesure.keys()
            else ""
        )
        theme = theme if theme else "Pas de thème"
        if theme not in by_theme.keys():
            by_theme[theme] = []
        by_theme[theme].append(mesure)

    rendered = template.render(mesures=by_theme, thematiques=thematiques)
    soup = BeautifulSoup(rendered, "html.parser")
    return soup.prettify()


def render_mesure_as_json(mesure: dict) -> str:  # pragma: no cover
    return json.dumps(mesure, indent=4)
