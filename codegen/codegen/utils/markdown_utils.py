import yaml
from mistletoe.block_token import BlockToken, Heading, CodeFence, Paragraph


def token_to_string(token: BlockToken, level=0) -> str:
    rendered = ''
    for child in token.children:
        if hasattr(child, 'leader'):
            rendered += ' ' * level + f'{child.leader} '
        if hasattr(child, 'children'):
            rendered += token_to_string(child, level + 1)
        elif hasattr(child, 'content'):
            rendered += child.content + '\n'

    if isinstance(token, Paragraph):
        rendered += '\n'

    return rendered


def is_keyword(token: BlockToken, keyword: str) -> bool:
    """Returns True if token is a reserved keyword."""
    return isinstance(token, Heading) and str(token.children[0].content).lower().startswith(keyword.lower())


def is_yaml(token: BlockToken) -> bool:
    """Returns True if token is a yaml blockquote"""
    return isinstance(token, CodeFence) and token.language == 'yaml'


def is_heading(token: BlockToken, level: int) -> bool:
    """Returns True if token is a reserved keyword."""
    return isinstance(token, Heading) and token.level == level


# writers functions
def void(token: BlockToken, definition: dict) -> None:
    """Does nothing"""
    pass


def save_yaml_data(token: BlockToken, dictionary: dict) -> None:
    """Save yaml block into dictionary under 'yaml' key"""
    if is_yaml(token):
        string = token.children[0].content
        parsed = yaml.safe_load(string)
        dictionary['yaml'] = parsed


def update_with_yaml(token: BlockToken, dictionary: dict) -> None:
    """Update a dictionary with the content of a parsed yaml"""
    if is_yaml(token):
        parsed = yaml.safe_load(token.children[0].content)
        dictionary.update(parsed)
