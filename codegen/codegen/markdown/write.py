from typing import List


def node_to_markdown(
    node: dict,
    yaml_keys: List[str],
    yaml_list: List[str],
    body_keys: List[str],
    children_key: str = '',
    heading: int = 1,
) -> str:
    """
    Convert a dictionary to markdown.
    The resulting markdown is usable by read.py builders
    """
    lines = []

    def simplify(value: str) -> str:
        """Make a yaml value from a string"""
        if isinstance(value, str):
            value = value.replace('\n', ' ')
            if value.startswith('%'):
                return f"'{value}'"
            return value
        if isinstance(value, bool):
            return str(value).lower()
        else:
            return value

    def add_line(s: str) -> None:
        lines.append(s)

    add_line(f"{'#' * heading} {node['nom']}")
    add_line("```yaml")
    for key in yaml_keys:
        if key in node.keys() and node[key]:
            add_line(f"{key}: {simplify(node[key])}")
    for key in yaml_list:
        if key in node.keys() and node[key]:
            add_line(f"{key}:")
            for item in node[key]:
                add_line(f"  - {simplify(item)}")
    add_line("```")

    for key in body_keys:
        if key in node.keys() and node[key]:
            add_line(f"## {key.capitalize()}")
            add_line(node[key])
            add_line('')

    if children_key and children_key in node.keys() and node[children_key]:
        add_line(f"{'#' * heading}# {children_key.capitalize()}")
        for child in node[children_key]:
            sub_section = node_to_markdown(
                node=child,
                yaml_keys=yaml_keys,
                yaml_list=yaml_list,
                body_keys=body_keys,
                children_key=children_key,
                heading=heading + 2
            )
            add_line(sub_section)

    add_line('')
    return '\n'.join(lines)
