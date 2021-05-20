from mistletoe import Document

from codegen.markdown.read import flat_builder


def indicateurs_builder(doc: Document) -> list:
    def builder():
        return {
            'nom': '',
            'indicateurs': [],
            'description': '',
        }

    return flat_builder(doc, node_builder=builder, children_key='indicateurs')
