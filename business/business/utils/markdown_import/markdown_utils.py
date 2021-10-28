from mistletoe import Document
from mistletoe.block_token import BlockToken, Heading, CodeFence, Paragraph
from mistletoe.span_token import Strong


def load_md(filename: str) -> Document:
    """Load a markdown file"""
    with open(filename, "r", encoding="utf8") as file:
        return Document(file)


def token_to_string(token: BlockToken, level=0) -> str:
    rendered = ""
    for child in token.children:
        if isinstance(child, Strong):
            rendered += f"**{child.children[0].content}**\n"
            continue
        if hasattr(child, "leader"):
            rendered += " " * level + f"{child.leader} "
        if hasattr(child, "children"):
            rendered += token_to_string(child, level + 1)
        elif hasattr(child, "content"):
            rendered += child.content + "\n"

    if isinstance(token, Paragraph):
        rendered += "\n"

    return rendered


def is_keyword(token: BlockToken, keyword: str) -> bool:
    """Returns True if token is a reserved keyword."""
    return (
        isinstance(token, Heading)
        and token.children
        and str(token.children[0].content).lower().strip() == keyword.lower()
    )


def is_yaml(token: BlockToken) -> bool:
    """Returns True if token is a yaml blockquote"""
    return isinstance(token, CodeFence) and token.language == "yaml"


def is_heading(token: BlockToken, level: int) -> bool:
    """Returns True if token is a reserved keyword."""
    return isinstance(token, Heading) and token.level == level
