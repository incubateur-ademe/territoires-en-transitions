from codegen.markdown.write import node_to_markdown


def indicateur_to_markdown(indicateur: dict) -> str:
    """Convert an indicateur to markdown. This markdown is usable by write.py build_indicateur"""
    return node_to_markdown(
        node=indicateur,
        yaml_keys=["id", "unite", "obligation_cae", "obligation_eci"],
        yaml_list=["actions", "programmes", "climat_pratic_ids"],
        body_keys=["description", "source"],
    )
