import os

import typer

from codegen.citergie.indicator_extractor import parse_indicators_xlsx, indicators_to_markdowns
from codegen.citergie.mesures_extractor import docx_to_mesures, add_climat_pratic, mesure_to_markdown
from codegen.utils.files import write, load_docx

app = typer.Typer()


@app.command()
def mesures(
    doc_file: str = typer.Option('../referentiels/sources/citergie.docx', "--docx", "-d"),
    correspondance_xlsx: str = typer.Option('../referentiels/sources/correspondance_citergie_climat_pratique.xlsx',
                                            "--correspondance", "-c"),
    output_dir: str = typer.Option('../referentiels/markdown/mesures_citergie', "--output", "-o")
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
            md = mesure_to_markdown(mesure)
            write(filename, md)

    typer.echo(f"All {len(mesures)} 'mesures' were exported in '{output_dir}' as markdown files.")


@app.command()
def indicateurs(
    indicateurs_xlsx: str = typer.Option('../referentiels/sources/indicateurs_citergie.xlsx', "--indicateurs", "-i"),
    correspondance_xlsx: str = typer.Option('../referentiels/sources/correspondance_citergie_climat_pratique.xlsx',
                                            "--correspondance", "-c"),
    output_dir: str = typer.Option('../referentiels/markdown/indicateurs_citergie', "--output", "-o")
) -> None:
    """
    Convert source xlsx files to 'indicateurs' markdown files.
    """
    typer.echo(f"Parsing files...")
    indicators = parse_indicators_xlsx(indicateurs=indicateurs_xlsx, correspondance=correspondance_xlsx)
    mds = indicators_to_markdowns(indicators)

    with typer.progressbar(mds.items()) as progress:
        for number, md in progress:
            filename = os.path.join(output_dir, f"{number}.md")
            write(filename, md)

    typer.echo(f"All {len(mds)} 'indicateurs' were exported in '{output_dir}' as markdown files.")
