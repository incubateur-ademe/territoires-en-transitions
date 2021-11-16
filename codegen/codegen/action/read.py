from mistletoe import Document

from codegen.markdown.read import markdown_parser


def build_action(doc: Document) -> dict:
    """Extract an action from a mesure markdown AST"""

    def builder():
        return {
            "nom": "",
            "actions": [],
            "description": "",
            "exemples": "",
            "contexte": "",
            "ressources": "",
            "preuve": ""
        }

    return markdown_parser(doc, node_builder=builder, children_key="actions")[-1]
