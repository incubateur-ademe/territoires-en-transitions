from mistletoe import Document

from codegen.markdown.read import markdown_parser


def indicateurs_builder(doc: Document) -> list:
    def builder():
        return {
            "nom": "",
            "id": "",
            "unite": "",
            "obligation_cae": "",
            "obligation_eci": "",
            "indicateurs": [],
            "actions": [],
            "programmes": [],
            "climat_pratic_ids": [],
            "description": "",
            "source": "",
        }

    return markdown_parser(doc, node_builder=builder, children_key="indicateurs")
