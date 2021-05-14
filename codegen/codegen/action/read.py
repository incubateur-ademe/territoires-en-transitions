from typing import Callable

from mistletoe import Document
from mistletoe.block_token import BlockToken, Heading, CodeFence

from codegen.utils.markdown_utils import update_with_yaml, is_keyword, token_to_string, is_heading


def meta(token: BlockToken, data: dict) -> None:
    """save ```yaml block"""
    return update_with_yaml(token, data)


def empty_action() -> dict:
    """Returns an action dictionary with default fields"""
    return {
        'nom': '',
        'actions': [],
        'description': '',
    }


def actions_writer(name_level: int) -> Callable:
    """Returns a closure to keep track of current writer function. Also scope actions related functions."""

    def head(token: BlockToken, action: dict) -> None:
        """Save action header"""
        if isinstance(token, Heading) and token.level == name_level:
            action['nom'] = token.children[0].content

    def description(token: BlockToken, action: dict) -> None:
        """Save action description as an HTML string"""
        if is_keyword(token, 'description'):
            return
        action['description'] += token_to_string(token)

    current: Callable = head

    def writer(token: BlockToken, mesure: dict) -> None:
        """Save actions"""
        if is_keyword(token, 'actions'):  # Actions keyword is handled in the top parser
            return

        nest_level = name_level // 2
        action = parent = mesure

        for level in range(nest_level):
            # Build the tree.
            if not action['actions']:
                action['actions'].append(empty_action())
            parent = action
            # Select the last leaf of the last branch.
            action = action['actions'][-1]

        nonlocal current
        if is_heading(token, name_level):  # Got a title
            if action['nom']:  # action is already named
                action = empty_action()
                parent['actions'].append(action)
            current = head
        elif isinstance(token, CodeFence):
            current = meta
        elif current == meta:
            current = description

        current(token, action)

    return writer


def build_action(doc: Document) -> dict:
    """Extract an action from a mesure markdown AST"""
    mesure = empty_action()
    name_level = 1
    writer = actions_writer(name_level=name_level)

    for token in doc.children:
        if is_keyword(token, 'actions'):
            name_level = token.level + 1
            writer = actions_writer(name_level=name_level)
        if is_heading(token, level=name_level - 2):
            name_level -= 2
            writer = actions_writer(name_level=name_level)

        writer(token, mesure)

    return mesure
