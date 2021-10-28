import os

from pathlib import Path


def remove_file(path: Path):
    if os.path.exists(path):
        os.remove(path)


def mkdir(path: Path):
    path.mkdir(parents=True, exist_ok=True)
