import glob
import json
import os

import typer

from codegen.citergie.indicators_generator import build_indicators, render_indicators_as_html
from codegen.citergie.mesures_generator import render_mesure_as_json, render_mesure_as_html, build_mesure, \
    render_mesures_summary_as_html, filter_indicateurs_by_mesure_id
from codegen.climat_pratic.thematiques_generator import build_thematiques, render_thematiques_as_typescript
from codegen.codegen.typescript import render_markdown_as_typescript
from codegen.utils.files import load_md, write

app = typer.Typer()


@app.command()
def all(
    client_dir: str = typer.Option('../client', "--client-root", "-c"),
    thematique_markdown_file='../referentiels/markdown/thematiques_climat_pratic/thematiques.md',
    thematique_output_dir='vendors',
    thematique_typescript=True,
    thematique_json=False,
    mesures_markdown_dir='../referentiels/markdown/mesures_citergie',
    mesures_output_dir='dist',
    mesures_html=True,
    mesures_json=False,
    indicateurs_markdown_dir='../referentiels/markdown/indicateurs_citergie',
    indicateurs_output_dir='dist',
    indicateurs_html=True,
    shared_markdown_dir='definitions/shared',
    shared_output_dir='vendors',
    shared_python=False,
    shared_typescript=True,
) -> None:
    """Run all `generate x` commands with default production values"""
    thematiques(
        markdown_file=thematique_markdown_file,
        output_dir=os.path.join(client_dir, thematique_output_dir),
        output_typescript=thematique_typescript,
        output_json=thematique_json,
    )
    mesures(
        mesures_dir=mesures_markdown_dir,
        indicateurs_dir=indicateurs_markdown_dir,
        output_dir=os.path.join(client_dir, mesures_output_dir),
        html=mesures_html,
        json=mesures_json,
    )
    indicateurs(
        markdown_dir=indicateurs_markdown_dir,
        output_dir=os.path.join(client_dir, indicateurs_output_dir),
        html=indicateurs_html
    )
    shared(
        markdown_dir=shared_markdown_dir,
        output_dir=os.path.join(client_dir, shared_output_dir),
        python=shared_python,
        typescript=shared_typescript,
    )


@app.command()
def indicateurs(
    markdown_dir: str = typer.Option('../referentiels/markdown/indicateurs_citergie', "--markdown", "-md"),
    output_dir: str = typer.Option('../client/dist', "--output", "-o"),
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
def mesures(
    mesures_dir: str = typer.Option('../referentiels/markdown/mesures_citergie', "--mesures-markdown", "-m"),
    indicateurs_dir: str = typer.Option('../referentiels/markdown/indicateurs_citergie', "--indicateurs-markdown",
                                        "-i"),
    output_dir: str = typer.Option('../client/dist', "--output", "-o"),
    html: bool = True,
    json: bool = False,
) -> None:
    """
    Convert 'mesures' markdown files to code.
    """
    indicateur_files = glob.glob(os.path.join(indicateurs_dir, '*.md'))
    indicateurs = []
    for filename in indicateur_files:
        md = load_md(filename)
        indicateurs.extend(build_indicators(md))

    mesure_files = glob.glob(os.path.join(mesures_dir, '*.md'))
    mesure_files.sort()
    mesures = []
    with typer.progressbar(mesure_files) as progress:
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
                mesure_indicateurs = filter_indicateurs_by_mesure_id(indicateurs, mesure['id'])
                html_doc = render_mesure_as_html(mesure, indicateurs=mesure_indicateurs)
                filename = os.path.join(output_dir, f'{filename_base}.html')
                write(filename, html_doc)

    if html:
        summary = render_mesures_summary_as_html(mesures)
        filename = os.path.join(output_dir, f'mesures.html')
        write(filename, summary)

    typer.echo(f"Processed {len(mesure_files)} 'mesures'.")


@app.command()
def shared(
    markdown_dir: str = typer.Option('definitions/shared', "--markdown", "-md"),
    output_dir: str = typer.Option('../client/vendors', "--output", "-o"),
    python: bool = typer.Option(False, '--python', '-py'),
    typescript: bool = typer.Option(True, '--typescript', '-ts'),
) -> None:  # pragma: no cover
    """
    Generate shared definitions.
    """
    files = glob.glob(os.path.join(markdown_dir, '*.md'))
    with typer.progressbar(files) as progress:
        for filename in progress:
            if filename[-6:] == 'poc.md':
                continue

            typer.echo(f'Processing {filename}...')
            md = load_md(filename)
            outputs = render_markdown_as_typescript(md)

            for name, content in outputs:
                write(os.path.join(output_dir, name), content)

    typer.echo(f"Processed {len(files)} shared definitions.")


@app.command()
def thematiques(
    markdown_file: str = typer.Option('../referentiels/markdown/thematiques_climat_pratic/thematiques.md', '--markdown',
                                      '-md'),
    output_dir: str = typer.Option('../client/vendors', '--output', '-o'),
    output_typescript: bool = typer.Option(True, '--typescript', '-ts'),
    output_json: bool = typer.Option(False, '--json'),
) -> None:
    """
    Convert 'thematiques' markdown to code.
    """
    markdown = load_md(markdown_file)
    thematiques = build_thematiques(markdown)

    if output_json:
        data = json.dumps(thematiques, indent=4)
        filename = os.path.join(output_dir, 'thematiques.json')
        write(filename, data)

    if output_typescript:
        typescript = render_thematiques_as_typescript(thematiques)
        filename = os.path.join(output_dir, 'thematiques.ts')
        write(filename, typescript)

    typer.echo(f"Rendered {len(thematiques)} 'thematiques' in {output_dir}.")
