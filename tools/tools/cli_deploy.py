import glob
import os

import typer

from tools.utils.s3 import make_s3_client

app = typer.Typer()


@app.command()
def upload_client(
        subdomain: str = typer.Option('sandbox', "--subdomain", "-s"),
        client: str = typer.Option('../client/dist', "--client", "-c")
) -> None:
    """Upload files into a sub domain bucket"""
    s3 = make_s3_client()
    bucket = f'{subdomain}.territoiresentransitions.fr'
    files = glob.glob(os.path.join(client, '*.*'))

    with typer.progressbar(files) as progress:
        for file in progress:
            name = os.path.basename(file)
            s3.upload_file(file, bucket, name, ExtraArgs={'ACL': 'public-read'})

    typer.echo(f"Uploaded {len(files)} to '{bucket}'.")
