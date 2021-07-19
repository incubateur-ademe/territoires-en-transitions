from typing import List

import jsbeautifier
from mistletoe import HTMLRenderer, Document

from codegen.utils.templates import build_jinja_environment


def extract_action_ids(indicateur: dict) -> List[str]:
    """Return linked actions ids"""
    if "actions" in indicateur.keys() and indicateur["actions"]:
        return [
            id.replace("climat_air_energie", "citergie").replace("/", "__")
            for id in indicateur["actions"]
        ]
    return []


def extract_thematique_id(indicateur: dict) -> str:
    """Return the main thematique id"""
    if "climat_pratic_ids" in indicateur.keys() and indicateur["climat_pratic_ids"]:
        return indicateur["climat_pratic_ids"][0]
    return "eci"


def extract_description(indicateur: dict) -> str:
    """Return the description in html"""
    renderer = HTMLRenderer()
    description = Document(indicateur["description"])
    return renderer.render(description)


def extract_unite(indicateur: dict) -> str:
    """Return the description in html"""
    if "unite" in indicateur.keys() and indicateur["unite"]:
        return indicateur["unite"]
    return ""


def render_indicators_as_typescript(
    indicateurs: List[dict], template_file="shared/ts/indicateurs_referentiel.j2"
) -> str:
    env = build_jinja_environment()
    template = env.get_template(template_file)

    for indicateur in indicateurs:
        indicateur["thematique_id"] = extract_thematique_id(indicateur)
        indicateur["action_ids"] = extract_action_ids(indicateur)
        indicateur["description"] = extract_description(indicateur)
        indicateur["unite"] = extract_unite(indicateur)

    rendered = template.render(indicateurs=indicateurs)
    return jsbeautifier.beautify(rendered)
