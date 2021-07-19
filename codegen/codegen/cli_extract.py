import os

import typer

from codegen.action.write import action_to_markdown
from codegen.citergie.indicator_extractor import (
    parse_indicators_xlsx,
    indicators_to_markdowns_legacy,
)
from codegen.citergie.mesures_extractor import (
    docx_to_mesures,
    add_climat_pratic,
    mesure_to_markdown_legacy,
    docx_to_parent_actions,
)
from codegen.economie_circulaire.indicateurs_extractor import parse_indicateurs_eci_xlsx
from codegen.economie_circulaire.referentiel_extractor import parse_referentiel_eci_xlsx
from codegen.indicateur.write import indicateur_to_markdown
from codegen.paths import orientations_markdown_dir
from codegen.utils.files import write, load_docx

app = typer.Typer()


@app.command()
def indicateurs_citergie(
    indicateurs_xlsx: str = typer.Option(
        "../referentiels/sources/indicateurs_citergie.xlsx", "--indicateurs", "-i"
    ),
    correspondance_xlsx: str = typer.Option(
        "../referentiels/sources/correspondance_citergie_climat_pratique.xlsx",
        "--correspondance",
        "-c",
    ),
    output_dir: str = typer.Option(
        "../referentiels/markdown/indicateurs_citergie", "--output", "-o"
    ),
) -> None:
    """
    Convert source xlsx files to 'indicateurs' markdown files.
    """
    typer.echo(f"Parsing files...")
    indicators = parse_indicators_xlsx(
        indicateurs=indicateurs_xlsx, correspondance=correspondance_xlsx
    )
    mds = indicators_to_markdowns_legacy(indicators)

    with typer.progressbar(mds.items()) as progress:
        for number, md in progress:
            filename = os.path.join(output_dir, f"{number}.md")
            write(filename, md)

    typer.echo(
        f"All {len(mds)} 'indicateurs' were exported in '{output_dir}' as markdown files."
    )


@app.command()
def indicateurs_eci(
    indicateurs_xlsx: str = "../referentiels/sources/indicateurs_eci_proposition_4.xlsx",
    output_dir: str = typer.Option(
        "../referentiels/markdown/indicateurs", "--output", "-o"
    ),
) -> None:
    """
    Convert source xlsx files to 'indicateurs' markdown files.
    """
    typer.echo(f"Parsing files...")
    indicateurs = parse_indicateurs_eci_xlsx(indicateurs_xlsx=indicateurs_xlsx)

    with typer.progressbar(indicateurs) as progress:
        for indicateur in progress:
            md = indicateur_to_markdown(indicateur)
            filename = os.path.join(
                output_dir, f"{indicateur['id'].replace('-', '_')}.md"
            )
            write(filename, md)

    typer.echo(
        f"All {len(indicateurs)} 'indicateurs' were exported in '{output_dir}' as markdown files."
    )


@app.command()
def mesures(
    doc_file: str = typer.Option(
        "../referentiels/sources/citergie.docx", "--docx", "-d"
    ),
    correspondance_xlsx: str = typer.Option(
        "../referentiels/sources/correspondance_citergie_climat_pratique.xlsx",
        "--correspondance",
        "-c",
    ),
    output_dir: str = typer.Option(
        "../referentiels/markdown/mesures_citergie", "--output", "-o"
    ),
) -> None:
    """
    Convert source docx file to 'mesures' markdown files.
    """
    typer.echo(f"Loading docx file: '{doc_file}'...")
    document = load_docx(doc_file)
    typer.echo(f"Reading citergie document...")
    mesures = docx_to_mesures(document)
    typer.echo(f"Found {len(mesures)} 'mesures'!")
    typer.echo(f"Reading correspondance table...")
    add_climat_pratic(mesures, correspondance_xlsx)

    with typer.progressbar(mesures) as progress:
        for mesure in progress:
            filename = os.path.join(output_dir, f"{mesure['id']}.md")
            md = mesure_to_markdown_legacy(mesure)
            write(filename, md)

    typer.echo(
        f"All {len(mesures)} 'mesures' were exported in '{output_dir}' as markdown files."
    )


@app.command()
def orientations(
    referentiel_file: str = "../referentiels/sources/referentiel_eci_v3_v4_sobr_principes_nettoyes.xlsx",
    output_dir: str = orientations_markdown_dir,
) -> None:
    orientations = parse_referentiel_eci_xlsx(referentiel_file)

    with typer.progressbar(orientations) as progress:
        for orientation in progress:
            markdown = action_to_markdown(orientation)
            filename = os.path.join(output_dir, f"{orientation['id']}.md")
            write(filename, markdown)

    typer.echo(
        f"All {len(orientations)} 'orientations' were exported in '{output_dir}' as markdown files."
    )


@app.command()
def domaines(
    doc_file: str = "../referentiels/sources/citergie.docx",
    output_dir: str = "../referentiels/markdown/mesures_citergie",
) -> None:
    """
    Convert source docx file to 'actions' markdown files.
    """
    typer.echo(f"Loading docx file: '{doc_file}'...")
    document = load_docx(doc_file)
    typer.echo(f"Reading citergie document...")
    actions = docx_to_parent_actions(document)
    typer.echo(f"Found {len(actions)} 'domaines'!")

    with typer.progressbar(actions) as progress:
        for action in progress:
            filename = os.path.join(output_dir, f"{action['id']}.md")
            md = action_to_markdown(action)
            write(filename, md)

    typer.echo(
        f"All {len(actions)} 'domaines' were exported in '{output_dir}' as markdown files."
    )
