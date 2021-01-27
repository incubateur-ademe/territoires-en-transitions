import typer

from codegen.citergie.extractor import load_docx, parse_docx, write_mesure_md

app = typer.Typer()


@app.command()
def citergie(
    doc_file: str = typer.Option('referentiels/source/citergie.docx', "--docx", "-d"),
    output_dir: str = typer.Option('referentiels/extracted/citergie', "--output", "-o")
) -> None:
    """
    Convert source docx file to 'mesures' markdown files.
    """
    typer.echo(f"Loading docx file: '{doc_file}'...")
    document = load_docx(doc_file)
    typer.echo(f"Reading document...")
    mesures = parse_docx(document)
    typer.echo(f"Found {len(mesures)} 'mesures'!")

    with typer.progressbar(mesures) as progress:
        for mesure in progress:
            write_mesure_md(mesure, output_dir)

    typer.echo(f"All {len(mesures)} 'mesures' were exported in '{output_dir}' as markdown files.")


@app.command()
def eci() -> None:
    """
    Convert source ECi files to markdown
    """
    typer.echo("Le référentiel économie circulaire n'est pas implémenté")
