def indicateur_to_markdown(indicateur: dict) -> str:
    """Convert an indicateur to markdown. This markdown is usable by read.py build_indicateur"""
    lines = []
    yaml_keys = ['id', 'unite', 'obligation_cae', 'obligation_eci']
    yaml_list = ['actions', 'programmes', 'climat_pratic_ids']
    body_keys = ['description', 'source']

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

    add_line(f"# {indicateur['nom']}")
    add_line("```yaml")
    for key in yaml_keys:
        if key in indicateur.keys() and indicateur[key]:
            add_line(f"{key}: {simplify(indicateur[key])}")
    for key in yaml_list:
        if key in indicateur.keys() and indicateur[key]:
            add_line(f"{key}:")
            for item in indicateur[key]:
                add_line(f"  - {simplify(item)}")
    add_line("```")

    for key in body_keys:
        if key in indicateur.keys() and indicateur[key]:
            add_line(f"## {key.capitalize()}")
            add_line(indicateur[key])
            add_line('')

    add_line('')
    return '\n'.join(lines)
