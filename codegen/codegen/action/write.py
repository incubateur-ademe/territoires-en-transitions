from codegen.markdown.write import node_to_markdown


def action_to_markdown(action: dict) -> str:
    """Convert an action to markdown. This markdown is usable by write.py build_action"""
    return node_to_markdown(
        node=action,
        children_key="actions",
        yaml_keys=[
            "id",
            "points",
            "ponderation",
            "climat_pratic_id",
            "categorie",
            "typologie",
        ],
        yaml_list=[],
        body_keys=["description", "exemples", "critère", "principe", "preuve"],
    )
