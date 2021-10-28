from typing import Callable, List

from mistletoe import Document
from mistletoe.block_token import BlockToken, Heading, CodeFence

from .markdown_utils import (
    update_with_yaml,
    is_keyword,
    token_to_string,
    is_heading,
)


def writer(
    name_level: int,
    node_builder: Callable,
    children_key: str = "",
) -> Callable:
    """Returns a closure to keep track of current writer function. Also scope actions related functions."""

    def head(token: BlockToken, action: dict) -> None:
        """Save leaf header"""
        if isinstance(token, Heading) and token.level == name_level:
            action["nom"] = (
                token.children[0].content if token.children else "pas de nom"
            )

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
        if is_keyword(
            token, children_key
        ):  # children_key keyword is handled in the top parser
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
            if leaf["nom"]:  # leaf is already named
                leaf = node_builder()
                parent[children_key].append(leaf)
            current = head
        elif isinstance(token, CodeFence):
            current = update_with_yaml
        elif current == update_with_yaml:
            current = section("description")
        elif is_heading(token, name_level + 1):
            title = token.children[0].content.strip()
            current = section(title)

        current(token, leaf)

    return node_writer


def markdown_parser(
    doc: Document, node_builder: Callable, children_key: str = ""
) -> List[dict]:
    """Extract a elements from a markdown AST"""
    elements = [node_builder()]
    name_level = 1  # the current level element names.
    current = writer(
        name_level=name_level, node_builder=node_builder, children_key=children_key
    )

    for token in doc.children:
        if is_keyword(token, children_key):
            name_level = token.level + 1
            current = writer(
                name_level=name_level,
                node_builder=node_builder,
                children_key=children_key,
            )

        elif is_heading(token, level=name_level - 2):
            name_level -= 2
            current = writer(
                name_level=name_level,
                node_builder=node_builder,
                children_key=children_key,
            )

        elif is_heading(token, level=1):
            if elements[-1]["nom"]:
                elements.append(node_builder())
            current = writer(
                name_level=name_level,
                node_builder=node_builder,
                children_key=children_key,
            )

        current(token, elements[-1])

    return elements
