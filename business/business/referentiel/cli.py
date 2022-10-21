import click
from business.referentiel.convert_indicateurs import (
    convert_indicateurs_markdown_folder_to_json,
)

from business.referentiel.convert_preuves import (
    convert_preuves_markdown_folder_to_json,
)
from business.referentiel.convert_actions import (
    convert_actions_markdown_folder_to_json,
)
from business.referentiel.convert_questions_and_regles import (
    convert_questions_and_regles_from_markdown_folder,
)


@click.group()
def cli_parse_preuves():
    pass


@click.group()
def cli_parse_actions():
    pass


@click.group()
def cli_parse_indicateurs():
    pass


@click.group()
def cli_parse_personnalisations():
    pass


cli = click.CommandCollection(
    sources=[
        cli_parse_preuves,
        cli_parse_actions,
        cli_parse_indicateurs,
        cli_parse_personnalisations,
    ]
)


# Actions
# -------
@cli_parse_actions.command()
@click.option("--output-json-file", required=True)
@click.option("--input-markdown-folder", required=True)
def parse_actions(
    output_json_file: str,
    input_markdown_folder: str,
):
    """Parse, convert and store actions given IN/OUT folders."""
    try:
        convert_actions_markdown_folder_to_json(input_markdown_folder, output_json_file)
    except Exception as e:
        raise SystemExit(e)


# Preuves
# -------
@cli_parse_preuves.command()
@click.option(
    "--output-json-file",
)
@click.option("--input-markdown-folder")
def parse_preuves(
    output_json_file: str,
    input_markdown_folder: str,
):
    """Parse, convert and store preuves given IN/OUT folders."""
    try:
        convert_preuves_markdown_folder_to_json(input_markdown_folder, output_json_file)
    except Exception as e:
        raise SystemExit(e)


# Indicateurs
# -----------
@cli_parse_indicateurs.command()
@click.option(
    "--output-json-file",
)
@click.option("--input-markdown-folder")
def parse_indicateurs(
    output_json_file: str,
    input_markdown_folder: str,
):
    """Parse, convert and store indicateurs given IN/OUT folders."""
    try:
        convert_indicateurs_markdown_folder_to_json(
            input_markdown_folder, output_json_file
        )
    except Exception as e:
        raise SystemExit(e)


# Questions and regles
# ---------------------
@cli_parse_personnalisations.command()
@click.option(
    "--output-json-file",
)
@click.option("--questions-markdown-folder")
@click.option("--regles-markdown-folder")
def parse_personnalisations(
    output_json_file: str,
    questions_markdown_folder: str,
    regles_markdown_folder: str,
):
    """Parse, convert and store questions given IN/OUT folders."""
    try:
        convert_questions_and_regles_from_markdown_folder(
            questions_markdown_folder, regles_markdown_folder, output_json_file
        )
    except Exception as e:
        raise SystemExit(e)
