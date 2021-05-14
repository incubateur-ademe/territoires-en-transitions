def action_to_markdown(action: dict, heading: int) -> str:
    lines = []

    def add_line(s: str) -> None:
        lines.append(s)

    add_line(f"{'#' * heading} {action['nom']}")
    add_line("```yaml")
    add_line(f"id: {action['id']}")
    if 'points' in action.keys():
        add_line(f"points: {action['points']}")
    if 'climat_pratic_id' in action.keys():
        add_line(f"climat_pratic_id: {action['climat_pratic_id']}")
    if 'categorie' in action.keys():
        add_line(f"categorie: {action['categorie']}")
    add_line("```")
    if 'description' in action.keys() and action['description']:
        add_line(f"{'#' * heading}# Description")
        add_line(action['description'])
    if 'actions' in action.keys() and action['actions']:
        add_line(f"{'#' * heading}# Actions")
        for child in action['actions']:
            add_line(action_to_markdown(child, heading=heading + 2))

    add_line('')
    return '\n'.join(lines)
