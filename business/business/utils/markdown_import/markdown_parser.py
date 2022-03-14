from __future__ import annotations

from typing import Callable, List, Optional, Dict

import yaml
from mistletoe import Document
from mistletoe.block_token import BlockToken, Heading, CodeFence

from .markdown_utils import (
    is_keyword,
    to_snake_case,
    token_to_string,
    is_heading,
    is_yaml,
)
from mistletoe import HTMLRenderer

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


def render_text_to_html(
        text: str,
):
    """Renders text markdown to html."""
    renderer = HTMLRenderer()
    return renderer.render(Document(text))


def make_section_writer(title: str) -> NodeWriter:
    def section_writer(token: BlockToken, node: dict) -> None:
        """Save leaf description as an HTML string"""
        snake_title = to_snake_case(title)
        if is_keyword(token, snake_title):
            node[snake_title] = ""
        elif snake_title in node.keys():
            node[snake_title] += render_text_to_html(token_to_string(token))

    return section_writer


def build_markdown_parser(
        title_key: str,
        description_key: str,
        initial_keyword: Optional[str],
        keyword_node_builders: Dict[str, Callable[[], dict]]
) -> Callable[[Document], List[dict]]:
    """
    Build a Markdown parser used to convert a Document into a list of nodes.

    :param title_key: the dict key to store the title
    :param description_key: the dict key for the description content
    :param initial_keyword: the keyword used to pick the initial node builder
    :param keyword_node_builders: node builders to be used when a keyword is encountered
    :return:
    """

    # keep track of the current keyword to retrieve the node builder from keyword_node_builders
    current_keyword = initial_keyword

    # keep track of the keywords by name level, so we can retrieve it when we go down on level
    keyword_per_level = dict()

    def build_current_node():
        return keyword_node_builders[current_keyword]()

    def node_writer_builder(
            name_level: int,
    ) -> Callable:
        """Returns a closure to keep track of current writer function. Also scope actions related functions."""
        head_writer = make_head_writer(title_key, name_level)

        # the current update function: update dict using BlockToken
        current_writer: NodeWriter = head_writer

        def node_writer(token: BlockToken, node: dict) -> None:
            """Save actions"""
            if current_keyword and is_keyword(
                    token, current_keyword
            ):  # children_key keyword is handled in the top parser
                return

            nonlocal keyword_per_level
            nest_level = name_level // 2
            leaf = parent = node

            for level in range(nest_level):
                # Build the tree.
                if not leaf[current_keyword]:
                    leaf[current_keyword].append(build_current_node())
                parent = leaf
                # Select the last leaf of the last branch.
                leaf = leaf[current_keyword][-1]

            nonlocal current_writer
            if is_heading(token, name_level):  # Got a title
                if leaf[title_key]:  # leaf is already named
                    leaf = build_current_node()
                    parent[current_keyword].append(leaf)
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
        """Extract elements from a markdown AST"""
        nodes = [build_current_node()]
        name_level = 1  # the current level element names.
        current_writer = node_writer_builder(name_level=name_level)
        nonlocal current_keyword
        keyword_per_level[name_level] = current_keyword

        for token in doc.children:
            kw_match = [kw for kw in keyword_node_builders.keys() if is_keyword(token, kw)]
            if kw_match:
                # the heading is a keyword
                name_level = token.level + 1
                current_keyword = kw_match[0]
                keyword_per_level[name_level] = current_keyword
                current_writer = node_writer_builder(
                    name_level=name_level,
                )

            elif is_heading(token, level=1):
                # The heading is level one
                name_level = 1
                if nodes[-1][title_key]:
                    nodes.append(build_current_node())
                current_keyword = keyword_per_level[name_level]
                current_writer = node_writer_builder(
                    name_level=name_level,
                )

            elif is_heading(token, level=name_level - 2):
                # The heading went down 2 levels
                name_level -= 2
                current_keyword = keyword_per_level[name_level]
                current_writer = node_writer_builder(
                    name_level=name_level,
                )

            current_writer(token, nodes[-1])

        return nodes

    return parser
