import yaml
from mistletoe.block_token import BlockToken, Heading, CodeFence


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
    """save ```yaml block into dictionary at 'yaml'"""
    if is_yaml(token):
        string = token.children[0].content
        parsed = yaml.safe_load(string)
        dictionary['yaml'] = parsed
