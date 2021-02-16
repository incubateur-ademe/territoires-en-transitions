import glob
import os

import typer

from codegen.citergie.indicators_generator import build_indicators, render_indicators_as_html
from codegen.citergie.mesures_generator import render_mesure_as_json, render_mesure_as_html, build_mesure, \
    render_mesures_summary_as_html
from codegen.codegen.generator import write_outputs
from codegen.utils.files import load_md, write

app = typer.Typer()


@app.command()
def mesures(
    markdown_dir: str = typer.Option('../referentiels/markdown/mesures_citergie', "--markdown", "-md"),
    output_dir: str = typer.Option('generated/citergie', "--output", "-o"),
    html: bool = True,
    json: bool = False,
) -> None:
    """
    Convert 'mesures' markdown files to code.
    """
    files = glob.glob(os.path.join(markdown_dir, '*.md'))
    mesures = []
    with typer.progressbar(files) as progress:
        for filename in progress:
            md = load_md(filename)
            mesure = build_mesure(md)
            mesures.append(mesure)
            filename_base = f"mesure_{mesure['id']}"

            if json:
                json_data = render_mesure_as_json(mesure)
                filename = os.path.join(output_dir, f'{filename_base}.json')
                write(filename, json_data)

            if html:
                html_doc = render_mesure_as_html(mesure)
                filename = os.path.join(output_dir, f'{filename_base}.html')
                write(filename, html_doc)

    if html:
        summary = render_mesures_summary_as_html(mesures)
        filename = os.path.join(output_dir, f'mesures.html')
        write(filename, summary)

    typer.echo(f"Processed {len(files)} 'mesures'.")


@app.command()
def indicateurs(
    markdown_dir: str = typer.Option('../referentiels/markdown/indicateurs_citergie', "--markdown", "-md"),
    output_dir: str = typer.Option('generated/indicateurs_citergie', "--output", "-o"),
    html: bool = True,
) -> None:
    """
    Convert 'indicateurs' markdown files to code.
    """
    files = glob.glob(os.path.join(markdown_dir, '*.md'))
    indicators = []
    for filename in files:
        typer.echo(f'Processing {filename}...')
        md = load_md(filename)
        indicators.extend(build_indicators(md))

    if html:
        rendered = render_indicators_as_html(indicators)
        filename = os.path.join(output_dir, 'indicateurs.html')
        write(filename, rendered)

    typer.echo(f"Rendered {len(files)} 'indicateurs' in {output_dir}.")


@app.command()
def shared(
    markdown_dir: str = typer.Option('definitions/shared', "--markdown", "-md"),
    output_dir: str = typer.Option('generated/definition/shared', "--output", "-o"),
    python: bool = True,
    js: bool = True,
) -> None:  # pragma: no cover
    """
    Generate shared definitions.
    """
    files = glob.glob(os.path.join(markdown_dir, '*.md'))
    with typer.progressbar(files) as progress:
        for filename in progress:
            typer.echo(f'Processing {filename}...')
            md = load_md(filename)
            write_outputs(md, output_dir, js=js, python=python)
    typer.echo(f"Processed {len(files)} shared definitions.")
