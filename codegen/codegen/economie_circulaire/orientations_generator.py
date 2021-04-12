"""Générateur pour les orientations, génère les exemples dans /generated/citergie."""
from typing import Callable

import yaml
from mistletoe import Document
from mistletoe.block_token import Heading, BlockToken, CodeFence, Paragraph

from codegen.utils.markdown_utils import void, is_heading, is_yaml, is_keyword


# todo use utils
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


def meta(token: BlockToken, data: dict) -> None:
    """save ```yaml block"""
    if is_yaml(token):
        parsed = yaml.safe_load(token.children[0].content)
        data.update(parsed)


def member_writer(keyword: str) -> Callable:
    """
    Render content to data at keyword.
    """
    def writer(token: BlockToken, data: dict) -> None:
        if is_keyword(token, keyword):
            return
        if keyword not in data.keys():
            data[keyword] = ''

        if is_yaml(token):
            meta(token, data[keyword])
        else:
            data[keyword] += token_to_string(token)

    return writer


def members_writer(level: int) -> Callable:
    """
    Add members to data for every heading at a given level.

    For every heading with a given level is encountered,
        - the title (heading content) is used to create a keyword
        - a new member writer is created to write the following content in data at keyword
    """
    current: Callable = void

    def writer(token: BlockToken, data: dict) -> None:
        nonlocal current
        if is_heading(token, level):
            keyword = token.children[0].content.lower()
            current = member_writer(keyword)

        current(token, data)

    return writer


def niveaux_writer() -> Callable:
    """Returns a closure to keep track of current writer function. Also scope niveaux related functions."""

    def head(token: BlockToken, niveau: dict) -> None:
        """Save niveau h3"""
        if isinstance(token, Heading) and token.level == 3:
            niveau['nom'] = token.children[0].content

    members = members_writer(4)
    current: Callable = head

    def writer(token: BlockToken, orientation: dict) -> None:
        """Save niveaux"""
        if is_keyword(token, 'niveaux'):
            return
        if 'niveaux' not in orientation.keys():
            orientation['niveaux'] = [{}]
        niveaux: list = orientation['niveaux']
        niveau: dict = niveaux[-1]

        nonlocal current
        if niveau:
            if is_heading(token, 3):
                niveau = {}
                niveaux.append(niveau)
                current = head
            elif isinstance(token, CodeFence):
                current = meta
            else:
                current = members

        current(token, niveau)

    return writer


def orientation_writer() -> Callable:
    """Returns a closure to keep track of current writer function. Also scope orientation related functions."""

    def head(token: BlockToken, orientation: dict) -> None:
        """save h1 into orientation"""
        if isinstance(token, Heading) and token.level == 1:
            orientation['nom'] = token.children[0].content

    def description(token: BlockToken, orientation: dict) -> None:
        """Save description as an HTML string"""
        if is_keyword(token, 'description'):
            return
        if 'description' not in orientation.keys():
            orientation['description'] = ''
        orientation['description'] += token_to_string(token)

    niveaux = niveaux_writer()

    current: Callable = head

    def writer(token: BlockToken, orientation: dict) -> None:
        nonlocal current
        if current is head and is_yaml(token):
            current = meta
        elif current is meta:
            current = void
        if is_heading(token, 2):
            if is_keyword(token, 'description'):
                current = description
            if is_keyword(token, 'niveaux'):
                current = niveaux
        current(token, orientation)

    return writer


def build_orientation(doc: Document) -> dict:
    """Extract orientations from markdown AST"""
    orientation = {}
    writer = orientation_writer()

    for token in doc.children:
        writer(token, orientation)

    return orientation


def legacy_orientation_as_mesure(orientation: dict) -> dict:
    """Converts a orientation to a mesure in order to use it with mesures_generator functions"""
    return {
        'nom': orientation['nom'],
        'climat_pratic_id': 'eci',
        'id': f'eci_{orientation["id"]}',
        'description': orientation['description'],
        'actions': orientation['niveaux'],
    }


