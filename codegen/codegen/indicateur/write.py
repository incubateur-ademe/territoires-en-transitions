from codegen.markdown.write import node_to_markdown
from format import yaml_keys, yaml_list, body_keys


def indicateur_to_markdown(indicateur: dict) -> str:
    """Convert an indicateur to markdown. This markdown is usable by write.py build_indicateur"""
    return node_to_markdown(
        node=indicateur,
        yaml_keys=yaml_keys,
        yaml_list=yaml_list,
        body_keys=body_keys,
    )
