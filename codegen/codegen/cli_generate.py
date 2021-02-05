import glob
import os

import typer

from codegen.citergie.indicators_generator import build_indicators, render_indicators_as_html
from codegen.citergie.mesures_generator import write_citergie_outputs
from codegen.codegen.generator import write_outputs
from codegen.utils.files import load_md, write

app = typer.Typer()


@app.command()
def mesures(
    markdown_dir: str = typer.Option('referentiels/extracted/citergie', "--markdown", "-md"),
    output_dir: str = typer.Option('generated/citergie', "--output", "-o"),
    html: bool = True,
    json: bool = True,
    js: bool = True,
) -> None:
    """
    Convert 'mesures' markdown files to code.
    """
    files = glob.glob(os.path.join(markdown_dir, '*.md'))
    with typer.progressbar(files) as progress:
        for filename in progress:
            md = load_md(filename)
            write_citergie_outputs(md, output_dir, json=json, js=js, html=html)
    typer.echo(f"Processed {len(files)} 'mesures'.")


@app.command()
def indicateurs(
    markdown_dir: str = typer.Option('referentiels/extracted/indicateurs_citergie', "--markdown", "-md"),
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
        filename = os.path.join(output_dir, 'all.html')
        write(filename, rendered)

    typer.echo(f"Rendered {len(files)} 'indicateurs' in {output_dir}.")


@app.command()
def shared(
    markdown_dir: str = typer.Option('definitions/shared', "--markdown", "-md"),
    output_dir: str = typer.Option('generated/definition/shared', "--output", "-o"),
    python: bool = True,
    js: bool = True,
) -> None:
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
