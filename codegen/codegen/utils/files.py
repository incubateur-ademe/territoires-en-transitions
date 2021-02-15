import os

import docx.document
import yaml
from mistletoe import Document


def load_md(filename: str) -> Document:
    """Load a markdown file"""
    with open(filename, 'r', encoding='utf8') as file:
        return Document(file)


def load_yaml(filename: str) -> dict:
    """Load a yaml file"""
    with open(filename, 'r') as file:
        return yaml.full_load(file)


def load_docx(doc_file: str) -> docx.Document:
    """Returns a Document from doc_file"""
    return docx.Document(doc_file)


def write(filename: str, contents: str) -> None:
    """Write a file, create parent directories if needed"""
    try:
        os.makedirs(os.path.dirname(filename), exist_ok=True)
    except OSError:
        pass
    with open(filename, 'w', encoding='utf8') as file:
        file.write(contents)
