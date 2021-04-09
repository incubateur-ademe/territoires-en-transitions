import glob
import json
import os
import warnings

import typer

import codegen.paths as paths
from codegen.citergie.indicators_generator import build_indicators, render_indicators_as_html
from codegen.citergie.mesures_generator import render_mesure_as_json, render_mesure_as_html, build_mesure, \
    render_mesures_summary_as_html, filter_indicateurs_by_mesure_id, build_action, render_actions_as_typescript, \
    relativize_ids
from codegen.climat_pratic.thematiques_generator import build_thematiques, render_thematiques_as_typescript
from codegen.codegen.typescript import render_markdown_as_typescript
from codegen.economie_circulaire.orientations_generator import legacy_orientation_as_mesure, build_orientation
from codegen.utils.files import load_md, write, sorted_files

app = typer.Typer()


@app.command()
def all(
    actions_mesures_markdown_dir=paths.mesures_markdown_dir,
    actions_client_output_dir=paths.shared_client_data_dir,
    actions_output_typescript=True,
    indicateurs_markdown_dir=paths.indicateurs_markdown_dir,
    indicateurs_output_client_dir=paths.indicateurs_client_output_dir,
    indicateurs_html=False,
    mesures_markdown_dir=paths.mesures_markdown_dir,
    mesures_orientations_dir=paths.orientations_markdown_dir,
    mesures_output_client_dir=paths.mesures_client_output_dir,
    mesures_html=False,
    mesures_json=False,
    shared_markdown_dir=paths.shared_markdown_dir,
    shared_client_output_dir=paths.shared_client_models_dir,
    shared_python=False,
    shared_typescript=True,
    thematique_markdown_file=paths.thematique_markdown_file,
    thematique_client_output_dir=paths.thematique_client_output_dir,
    thematique_typescript=True,
    thematique_json=False,
) -> None:
    """Run all `generate x` commands with default production values"""

    actions(
        mesures_markdown_dir=actions_mesures_markdown_dir,
        client_output_dir=actions_client_output_dir,
        output_typescript=actions_output_typescript,
    )
    indicateurs(
        markdown_dir=indicateurs_markdown_dir,
        output_dir=indicateurs_output_client_dir,
        html=indicateurs_html
    )
    mesures(
        mesures_dir=mesures_markdown_dir,
        indicateurs_dir=indicateurs_markdown_dir,
        orientations_dir=mesures_orientations_dir,
        output_dir=mesures_output_client_dir,
        html=mesures_html,
        json=mesures_json,
    )
    shared(
        markdown_dir=shared_markdown_dir,
        output_dir=shared_client_output_dir,
        python=shared_python,
        typescript=shared_typescript,
    )
    thematiques(
        markdown_file=thematique_markdown_file,
        output_dir=thematique_client_output_dir,
        output_typescript=thematique_typescript,
        output_json=thematique_json,
    )


@app.command()
def actions(
    mesures_markdown_dir=paths.mesures_markdown_dir,
    orientations_markdown_dir=paths.orientations_markdown_temp_dir,
    client_output_dir=paths.shared_client_data_dir,
    output_typescript=True,
) -> None:
    # citergie
    files = glob.glob(os.path.join(mesures_markdown_dir, '*.md'))
    actions_citergie = []

    for file in files:
        md = load_md(file)
        action = build_action(md)
        actions_citergie.append(action)

    relativize_ids(actions_citergie, 'citergie')

    # economie circulaire
    files = sorted_files(orientations_markdown_dir, 'md')
    actions_economie_circulaire = []

    for file in files:
        md = load_md(file)
        action = build_action(md)
        actions_economie_circulaire.append(action)

    relativize_ids(actions_economie_circulaire, 'economie_circulaire')

    if output_typescript:
        typescript = render_actions_as_typescript(actions_citergie + actions_economie_circulaire)
        filename = os.path.join(client_output_dir, 'actions_referentiels.ts')
        write(filename, typescript)


@app.command()
def indicateurs(
    markdown_dir: str = typer.Option(paths.indicateurs_markdown_dir, "--markdown", "-md"),
    output_dir: str = typer.Option(paths.indicateurs_client_output_dir, "--output", "-o"),
    html: bool = False,
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
    mesures_dir: str = typer.Option(paths.mesures_markdown_dir, "--mesures-markdown", "-m"),
    orientations_dir: str = typer.Option(paths.orientations_markdown_dir, "--orientations-markdown", "-om"),
    indicateurs_dir: str = typer.Option(paths.indicateurs_markdown_dir, "--indicateurs-markdown", "-i"),
    output_dir: str = typer.Option(paths.mesures_client_output_dir, "--output", "-o"),
    html: bool = False,
    json: bool = False,
) -> None:
    """
    Convert 'mesures' markdown files to code.
    """
    # Load indicateurs
    indicateur_files = sorted_files(indicateurs_dir, 'md')
    indicateurs = []
    with typer.progressbar(indicateur_files) as progress:
        for filename in progress:
            md = load_md(filename)
            indicateurs.extend(build_indicators(md))

    # Load mesures
    mesure_files = sorted_files(mesures_dir, 'md')
    mesure_files.sort()
    mesures = []

    with typer.progressbar(mesure_files) as progress:
        for filename in progress:
            md = load_md(filename)
            mesure = build_mesure(md)
            mesures.append(mesure)

    # Load orientations as mesures
    orientation_files = sorted_files(orientations_dir, 'md')

    with typer.progressbar(orientation_files) as progress:
        for filename in progress:
            md = load_md(filename)
            orientation = build_orientation(md)
            mesure = legacy_orientation_as_mesure(orientation)
            mesures.append(mesure)

    # Output mesures
    with typer.progressbar(mesures) as progress:
        for mesure in progress:
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
    markdown_dir: str = typer.Option(paths.shared_markdown_dir, "--markdown", "-md"),
    output_dir: str = typer.Option(paths.shared_client_models_dir, "--output", "-o"),
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
    markdown_file: str = typer.Option(paths.thematique_markdown_file, '--markdown', '-md'),
    output_dir: str = typer.Option(paths.thematique_client_output_dir, '--output', '-o'),
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
