import click

from business.referentiel.parse_preuves import (
    convert_preuves_markdown_folder_to_json,
)


@click.group()
def cli_parse_preuves():
    pass


cli = click.CommandCollection(sources=[cli_parse_preuves])


@cli_parse_preuves.command()
@click.option(
    "--output-json-file",
    default="./data/preuves.json",
    required=False,
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


if __name__ == "__main__":
    cli()


# Command lines
# --------------
#  python business/referentiel/cli2.py parse-preuves --input-markdown-folder "../markdown/preuves" --output-json-file "../data_layer/preuves.json"
