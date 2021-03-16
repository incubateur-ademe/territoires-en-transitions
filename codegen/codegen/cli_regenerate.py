import glob
import os

import typer

from codegen.citergie.indicator_extractor import indicators_to_markdown
from codegen.citergie.indicators_generator import build_indicators
from codegen.citergie.mesures_extractor import mesure_to_markdown
from codegen.citergie.mesures_generator import build_mesure
from codegen.climat_pratic.thematiques_generator import build_thematiques
from codegen.utils.files import load_md, write

app = typer.Typer()


@app.command()
def mesures_thematiques(
    mesures_dir: str = typer.Option('../referentiels/markdown/mesures_citergie', "--mesures", "-m"),
    thematiques_file: str = typer.Option('../referentiels/markdown/thematiques_climat_pratic/thematiques.md',
                                         '--thematiques',
                                         '-t')
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
    indicateurs_dir: str = typer.Option('../referentiels/markdown/indicateurs_citergie',
                                        '--indicateurs',
                                        '-i'),
    thematiques_file: str = typer.Option('../referentiels/markdown/thematiques_climat_pratic/thematiques.md',
                                         '--thematiques',
                                         '-t'),
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
        md = indicators_to_markdown(indicators)
        write(filename, md)
