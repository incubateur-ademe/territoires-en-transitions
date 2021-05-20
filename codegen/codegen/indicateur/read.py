from mistletoe import Document

from codegen.markdown.read import flat_builder


def indicateurs_builder(doc: Document) -> list:
    return flat_builder(doc, 'indicateurs')
