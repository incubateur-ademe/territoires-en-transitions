from mistletoe import Document

from codegen.markdown.read import tree_builder


def build_action(doc: Document) -> dict:
    """Extract an action from a mesure markdown AST"""
    def builder():
        return {
            'nom': '',
            'actions': [],
            'description': '',
        }

    return tree_builder(doc, node_builder=builder, children_key='actions')
