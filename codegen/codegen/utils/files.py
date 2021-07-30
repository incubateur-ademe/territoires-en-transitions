import glob
import os
from typing import List

import docx.document
from mistletoe import Document


def load_md(filename: str) -> Document:
    """Load a markdown file"""
    with open(filename, "r", encoding="utf8") as file:
        return Document(file)


def load_docx(doc_file: str) -> docx.Document:
    """Returns a Document from doc_file"""
    return docx.Document(doc_file)


def write(filename: str, contents: str) -> None:  # pragma: no cover
    """Write a file, create parent directories if needed"""
    try:
        os.makedirs(os.path.dirname(filename), exist_ok=True)
    except OSError:
        pass
    with open(filename, "w", encoding="utf8") as file:
        file.write(contents)


def sorted_files(directory: str, extension: str) -> List[str]:
    """
    :param directory The directory containing the files.
    :param extension The file extension without the separator. Use 'md' for markdown files.
    :returns A list of sorted files.
    """
    files = glob.glob(os.path.join(directory, f"*.{extension}"))
    files.sort()
    return files
