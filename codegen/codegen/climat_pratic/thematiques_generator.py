from typing import Dict

import jsbeautifier
from mistletoe import Document
from mistletoe.block_token import BlockToken

from codegen.utils.markdown_utils import void, is_yaml, save_yaml_data
from codegen.utils.templates import build_jinja_environment


def thematiques(token: BlockToken, thematiques: dict):
    save_yaml_data(token, thematiques)


def build_thematiques(markdown: Document) -> Dict[str, str]:
    """Convert thématiques markdown document to a dictionary."""
    writer = void
    data = {}

    for token in markdown.children:
        if is_yaml(token):
            writer = thematiques
        else:
            writer = void

        writer(token, data)

    return data['yaml']['thematiques']


def render_thematiques_as_typescript(thematiques: Dict[str, str],
                                     template_file='shared/ts/thematiques.j2') -> str:
    """Render all thématiques into a single typescript file."""
    env = build_jinja_environment()
    template = env.get_template(template_file)
    rendered = template.render(thematiques=thematiques)
    return jsbeautifier.beautify(rendered)
