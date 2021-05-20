import glob
import os

import typer

import codegen.paths as paths
from codegen.citergie.indicator_extractor import indicators_to_markdown_legacy_2
from codegen.citergie.indicators_generator import build_indicators
from codegen.citergie.mesures_extractor import mesure_to_markdown
from codegen.citergie.mesures_generator import build_mesure
from codegen.climat_pratic.thematiques_generator import build_thematiques
from codegen.indicateur.save import indicateur_to_markdown
from codegen.utils.files import load_md, write

app = typer.Typer()


@app.command()
def mesures_nested_actions(
    mesures_dir=paths.mesures_markdown_dir,
) -> None:
    """
    Regenerate (overwrite) markdown files using nested actions
    """
    mesures_files = glob.glob(os.path.join(mesures_dir, '*.md'))
    count = 0

    with typer.progressbar(mesures_files) as progress:
        for filename in progress:
            md = load_md(filename)

            # todo make this recursive.
            mesure = build_mesure(md)

            for action in mesure['actions']:
                if 'description' not in action.keys():
                    continue
                action['actions'] = []
                description = str(action['description'])
                stripped_description = ''
                lines = description.splitlines()
                for line in lines:
                    if line.startswith('- '):
                        index = len(action['actions']) + 1
                        action['actions'].append({
                            'id': f"{action['id']}.{index}",
                            "nom": line.lstrip('- '),
                        })
                    elif action['actions']:  # the line does is not an item, add it to the current action description
                        line = line.strip()
                        if line:
                            stripped_description += f'{line}\n'
                if action['actions']:  # we have consumed the description lines to create sub actions
                    count += len(action['actions'])
                    action['description'] = stripped_description

            md = mesure_to_markdown(mesure)

            # temp_name = os.path.join("../referentiels/markdown/mesures_temp", os.path.basename(filename))
            write(filename, md)

    typer.echo(f"All {len(mesures_files)} 'mesures' were regenerated extracting {count} 'tasks'.")


@app.command()
def mesures_thematiques(
    mesures_dir=paths.mesures_markdown_dir,
    thematiques_file=paths.thematique_markdown_file,
) -> None:
    """
    Regenerate (overwrite) markdown files using thematiques
    """
    markdown = load_md(thematiques_file)
    thematiques = build_thematiques(markdown)
    thematiques_lookup = {thematiques[id]: id for id in thematiques.keys()}

    mesures_files = glob.glob(os.path.join(mesures_dir, '*.md'))

    with typer.progressbar(mesures_files) as progress:
        for filename in progress:
            md = load_md(filename)
            mesure = build_mesure(md)
            # -- extract this for future regen function on mesures --
            climat_pratic = mesure['climat_pratic']
            mesure['climat_pratic_id'] = thematiques_lookup[climat_pratic]
            # ---
            md = mesure_to_markdown(mesure)
            write(filename, md)

    typer.echo(f"All {len(mesures_files)} 'mesures' were regenerated.")


@app.command()
def indicateurs_thematiques(
    indicateurs_dir=paths.indicateurs_markdown_dir,
    thematiques_file=paths.thematique_markdown_file,
) -> None:
    """
    Regenerate (overwrite) markdown files using thematiques
    """
    markdown = load_md(thematiques_file)
    thematiques = build_thematiques(markdown)
    thematiques_lookup = {thematiques[id]: id for id in thematiques.keys()}

    indicateur_files = glob.glob(os.path.join(indicateurs_dir, '*.md'))
    for filename in indicateur_files:
        typer.echo(f'Processing {filename}...')
        md = load_md(filename)
        indicators = build_indicators(md)
        for indicator in indicators:
            # -- extract this for future regen function on indicator --
            climat_pratic = indicator['climat_pratic']
            indicator['climat_pratic_ids'] = [thematiques_lookup[name] for name in climat_pratic]
            # ---
        md = indicators_to_markdown_legacy_2(indicators)
        write(filename, md)


@app.command()
def indicateurs_universal(
    indicateurs_old_dir='../referentiels/markdown/indicateurs_citergie',
    indicateurs_dir='../referentiels/markdown/indicateurs',
) -> None:
    """
    Regenerate (overwrite) markdown files in a new format
    """
    old_files = glob.glob(os.path.join(indicateurs_old_dir, '*.md'))

    for filename in old_files:
        typer.echo(f'Processing {filename}...')
        md = load_md(filename)
        indicateurs = build_indicators(md)
        new_md = ''
        for indicateur in indicateurs:
            # -- extract this for future regen function on indicator --
            indicateur['id'] = 'cae-' + str(indicateur['id'])

            indicateur['actions'] = []
            for mesure_id in indicateur['mesures']:
                indicateur['actions'].append('climat_air_energie/' + mesure_id)

            indicateur['obligation_cae'] = indicateur['obligation_citergie']
            indicateur['programmes'] = ['climat_air_energie']

            if indicateur['pcaet']:
                indicateur['programmes'].append('pcaet')


            new_md += indicateur_to_markdown(indicateur) + '\n'
            # ---
        new_filename = 'cae_' + os.path.basename(filename)
        write(os.path.join(indicateurs_dir, new_filename), new_md)
