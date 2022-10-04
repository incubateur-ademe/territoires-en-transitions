import os
import json
from pathlib import Path

from business.referentiel.cli import (
    parse_actions,
    parse_indicateurs,
    parse_personnalisations,
    parse_preuves,
)
from tests.utils.files import remove_file, mkdir

json_path = Path("./tests/data/tmp/test.json")
mkdir(json_path.parent)


def test_cli_parse_actions():

    remove_file(json_path)
    try:
        parse_actions(
            [
                "--input-markdown-folder",
                "tests/data/md_referentiel_example_ok",
                "--output-json-file",
                json_path,
            ]
        )
    except SystemExit:
        pass
    assert os.path.isfile(json_path)

    with json_path.open("r") as file:
        data = json.load(file)

    assert len(data["definitions"]) == 8
    assert len(data["children"]) == 8


def test_cli_parse_preuves():
    remove_file(json_path)
    try:
        parse_preuves(
            [
                "--input-markdown-folder",
                "tests/data/md_preuves_example_ok",
                "--output-json-file",
                json_path,
            ]
        )
    except SystemExit:
        pass
    assert os.path.isfile(json_path)

    with json_path.open("r") as file:
        data = json.load(file)
    assert len(data["preuves"]) == 2


def test_cli_parse_indicateurs():
    remove_file(json_path)
    try:
        parse_indicateurs(
            [
                "--input-markdown-folder",
                "tests/data/md_indicateurs_example_ok",
                "--output-json-file",
                json_path,
            ]
        )
    except SystemExit:
        pass
    assert os.path.isfile(json_path)

    with json_path.open("r") as file:
        data = json.load(file)
    assert len(data["indicateurs"]) == 2


def test_cli_parse_personnalisations():
    remove_file(json_path)
    try:
        parse_personnalisations(
            [
                "--questions-markdown-folder",
                "tests/data/md_questions_example_ok",
                "--regles-markdown-folder",
                "tests/data/md_personnalisation_example_ok",
                "--output-json-file",
                json_path,
            ]
        )
    except SystemExit:
        pass
    assert os.path.isfile(json_path)

    with json_path.open("r") as file:
        data = json.load(file)
    assert len(data["questions"]) == 5
    assert len(data["regles"]) == 1
