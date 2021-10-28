from __future__ import annotations

from typing import Callable, List, Optional

import yaml
from mistletoe import Document
from mistletoe.block_token import BlockToken, Heading, CodeFence

from .markdown_utils import (
    is_keyword,
    token_to_string,
    is_heading,
    is_yaml,
)

NodeWriter = Callable[[BlockToken, dict], None]


def yaml_writer(token: BlockToken, node: dict) -> None:
    """Update a node with the content of a parsed yaml"""
    if is_yaml(token):
        parsed = yaml.safe_load(token.children[0].content)
        node.update(parsed)


def make_head_writer(title_key: str, name_level: int) -> NodeWriter:
    def head_writer(token: BlockToken, node: dict) -> None:
        """Save leaf header"""
        if isinstance(token, Heading) and token.level == name_level:
            node[title_key] = (
                token.children[0].content if token.children else "pas de nom"
            )

    return head_writer


def make_section_writer(title: str) -> NodeWriter:
    def section_writer(token: BlockToken, node: dict) -> None:
        """Save leaf description as an HTML string"""
        if is_keyword(token, title):
            return
        if title.lower() in node.keys():
            node[title.lower()] += token_to_string(token)

    return section_writer


def build_markdown_parser(
    title_key: str, description_key: str, children_key: Optional[str]
) -> Callable[[Document], List[dict]]:
    def node_builder() -> dict:
        if children_key:
            return {title_key: "", children_key: []}
        else:
            return {
                title_key: "",
            }

    def node_writer_builder(
        name_level: int,
    ) -> Callable:
        """Returns a closure to keep track of current writer function. Also scope actions related functions."""

        head_writer = make_head_writer(title_key, name_level)

        # the current update function: update dict using BlockToken
        current_writer: NodeWriter = head_writer

        def node_writer(token: BlockToken, node: dict) -> None:
            """Save actions"""
            if children_key and is_keyword(
                token, children_key
            ):  # children_key keyword is handled in the top parser
                return

            nest_level = name_level // 2
            leaf = parent = node

            for level in range(nest_level):
                # Build the tree.
                if not leaf[children_key]:
                    leaf[children_key].append(node_builder())
                parent = leaf
                # Select the last leaf of the last branch.
                leaf = leaf[children_key][-1]

            nonlocal current_writer
            if is_heading(token, name_level):  # Got a title
                if leaf[title_key]:  # leaf is already named
                    leaf = node_builder()
                    parent[children_key].append(leaf)
                current_writer = head_writer
            elif isinstance(token, CodeFence):
                current_writer = yaml_writer
            elif current_writer == yaml_writer:
                current_writer = make_section_writer(description_key)
            elif is_heading(token, name_level + 1):
                title = token.children[0].content.strip()
                current_writer = make_section_writer(title)

            current_writer(token, leaf)

        return node_writer

    def parser(doc: Document) -> List[dict]:
        """Extract a elements from a markdown AST"""
        nodes = [node_builder()]
        name_level = 1  # the current level element names.
        current_writer = node_writer_builder(name_level=name_level)

        for token in doc.children:
            if children_key and is_keyword(token, children_key):
                name_level = token.level + 1
                current_writer = node_writer_builder(
                    name_level=name_level,
                )

            elif is_heading(token, level=name_level - 2):
                name_level -= 2
                current_writer = node_writer_builder(
                    name_level=name_level,
                )

            elif is_heading(token, level=1):
                if nodes[-1][title_key]:
                    nodes.append(node_builder())
                current_writer = node_writer_builder(
                    name_level=name_level,
                )

            current_writer(token, nodes[-1])

        return nodes

    return parser
