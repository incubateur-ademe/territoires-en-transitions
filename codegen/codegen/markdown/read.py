from typing import Callable

from mistletoe import Document
from mistletoe.block_token import BlockToken, Heading, CodeFence

from codegen.utils.markdown_utils import update_with_yaml, is_keyword, token_to_string, is_heading


def meta(token: BlockToken, data: dict) -> None:
    """save ```yaml block"""
    update_with_yaml(token, data)
    data['id'] = str(data['id'])  # so ids are not interpreted as floats.


def writer(name_level: int, node_builder: Callable, children_key: str = '', ) -> Callable:
    """Returns a closure to keep track of current writer function. Also scope actions related functions."""

    def head(token: BlockToken, action: dict) -> None:
        """Save leaf header"""
        if isinstance(token, Heading) and token.level == name_level:
            action['nom'] = token.children[0].content if token.children else 'pas de nom'

    def section(title: str) -> Callable:
        def description(token: BlockToken, action: dict) -> None:
            """Save leaf description as an HTML string"""
            if is_keyword(token, title):
                return
            if title.lower() in action.keys():
                action[title.lower()] += token_to_string(token)

        return description

    current: Callable = head

    def node_writer(token: BlockToken, mesure: dict) -> None:
        """Save actions"""
        if is_keyword(token, children_key):  # children_key keyword is handled in the top parser
            return

        nest_level = name_level // 2
        leaf = parent = mesure

        for level in range(nest_level):
            # Build the tree.
            if not leaf[children_key]:
                leaf[children_key].append(node_builder())
            parent = leaf
            # Select the last leaf of the last branch.
            leaf = leaf[children_key][-1]

        nonlocal current
        if is_heading(token, name_level):  # Got a title
            if leaf['nom']:  # leaf is already named
                leaf = node_builder()
                parent[children_key].append(leaf)
            current = head
        elif isinstance(token, CodeFence):
            current = meta
        elif current == meta:
            current = section('description')
        elif is_heading(token, name_level + 1):
            title = token.children[0].content.strip()
            current = section(title)

        current(token, leaf)

    return node_writer


def tree_builder(doc: Document, node_builder: Callable, children_key: str = '') -> dict:
    """Extract a tree from a markdown AST"""
    root = node_builder()
    name_level = 1
    current = writer(name_level=name_level, node_builder=node_builder, children_key=children_key)

    for token in doc.children:
        if is_keyword(token, children_key):
            name_level = token.level + 1
            current = writer(name_level=name_level, node_builder=node_builder, children_key=children_key)

        if is_heading(token, level=name_level - 2):
            name_level -= 2
            current = writer(name_level=name_level, node_builder=node_builder, children_key=children_key)

        if is_heading(token, level=name_level):
            name_level = name_level
            current = writer(name_level=name_level, node_builder=node_builder, children_key=children_key)

        current(token, root)

    return root


def flat_builder(doc: Document, node_builder: Callable, children_key: str = '') -> list:
    """Use the tree builder then flatten the results"""
    tree = tree_builder(doc, node_builder=node_builder, children_key=children_key)
    children = []

    def flatten(node: dict) -> None:
        children.append(node)
        for child in node[children_key]:
            flatten(child)

    flatten(tree)

    for child in children:
        del child[children_key]

    return children
