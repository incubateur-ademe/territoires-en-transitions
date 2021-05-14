import glob
import json
import os

import typer

import codegen.paths as paths
from codegen.action.process import relativize_ids, clean_thematiques, propagate_thematiques
from codegen.action.read import build_action
from codegen.action.render import render_actions_as_typescript
from codegen.citergie.indicators_generator import build_indicators, render_indicators_as_html, \
    render_indicators_as_typescript
from codegen.climat_pratic.thematiques_generator import build_thematiques, render_thematiques_as_typescript
from codegen.codegen.python import render_markdown_as_python
from codegen.codegen.typescript import render_markdown_as_typescript
from codegen.utils.files import load_md, write, sorted_files

app = typer.Typer()


@app.command()
def all(
    actions_mesures_markdown_dir=paths.mesures_markdown_dir,
    actions_client_output_dir=paths.shared_client_data_dir,
    actions_output_typescript=True,
    indicateurs_markdown_dir=paths.indicateurs_markdown_dir,
    indicateurs_output_client_dir=paths.shared_client_data_dir,
    indicateurs_html=False,
    indicateurs_typescript=True,
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
        indicateurs_markdown_dir=indicateurs_markdown_dir,
        client_output_dir=indicateurs_output_client_dir,
        html=indicateurs_html,
        typescript=indicateurs_typescript,
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
        client_output_dir=shared_client_output_dir,
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
    orientations_markdown_dir=paths.orientations_markdown_dir,
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
        action['climat_pratic_id'] = 'eci'
        actions_economie_circulaire.append(action)

    relativize_ids(actions_economie_circulaire, 'economie_circulaire')

    all_actions = actions_citergie + actions_economie_circulaire
    all_actions = clean_thematiques(all_actions)
    all_actions = propagate_thematiques(all_actions)

    if output_typescript:
        typescript = render_actions_as_typescript(all_actions)
        filename = os.path.join(client_output_dir, 'actions_referentiels.ts')
        write(filename, typescript)


@app.command()
def indicateurs(
    indicateurs_markdown_dir: str = typer.Option(paths.indicateurs_markdown_dir, "--markdown", "-md"),
    client_output_dir: str = paths.shared_client_data_dir,
    html: bool = False,
    typescript: bool = True,
) -> None:
    """
    Convert 'indicateurs' markdown files to code.
    """
    files = glob.glob(os.path.join(indicateurs_markdown_dir, '*.md'))
    indicators = []
    for filename in files:
        typer.echo(f'Processing {filename}...')
        md = load_md(filename)
        indicators.extend(build_indicators(md))

    if html:
        rendered = render_indicators_as_html(indicators)
        filename = os.path.join(client_output_dir, 'indicateurs.html')
        write(filename, rendered)

    if typescript:
        rendered = render_indicators_as_typescript(indicators)
        filename = os.path.join(client_output_dir, 'indicateurs_referentiels.ts')
        write(filename, rendered)

    typer.echo(f"Rendered {len(files)} 'indicateurs' in {client_output_dir}.")


@app.command()
def shared(
    markdown_dir: str = paths.shared_markdown_dir,
    typescript: bool = True,
    client_output_dir: str = paths.shared_client_models_dir,
    python: bool = False,
    api_output_dir: str = paths.shared_api_models_dir,
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

            if typescript:
                outputs = render_markdown_as_typescript(md)
                for name, content in outputs:
                    write(os.path.join(client_output_dir, name), content)

            if python:
                outputs = render_markdown_as_python(md)
                for name, content in outputs:
                    write(os.path.join(api_output_dir, name), content)

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
