def action_to_markdown(action: dict, heading: int) -> str:
    """Convert an action to markdown. This markdown is usable by read.py build_action"""
    lines = []
    yaml_keys = ['id', 'points', 'ponderation', 'climat_pratic_id', 'categorie', 'typologie']
    body_keys = ['description', 'exemples', 'critère', 'principe']

    def simplify(value: str) -> str:
        """Make a yaml value from a string"""
        return value.replace('\n', ' ')

    def add_line(s: str) -> None:
        lines.append(s)

    add_line(f"{'#' * heading} {action['nom']}")
    add_line("```yaml")
    for key in yaml_keys:
        if key in action.keys() and action[key]:
            add_line(f"{key}: {simplify(action[key])}")
    add_line("```")

    for key in body_keys:
        if key in action.keys() and action[key]:
            add_line(f"{'#' * heading}# {key.capitalize()}")
            add_line(action[key])
            add_line('')

    if 'actions' in action.keys() and action['actions']:
        add_line(f"{'#' * heading}# Actions")
        for child in action['actions']:
            add_line(action_to_markdown(child, heading=heading + 2))

    add_line('')
    return '\n'.join(lines)
