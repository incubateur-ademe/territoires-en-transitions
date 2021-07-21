import os

import typer
from botocore.client import BaseClient

from tools.utils.s3 import make_s3_client

app = typer.Typer()


@app.command()
def upload_client(
        subdomain: str = typer.Option('sandbox', "--subdomain", "-s"),
        app_dir: str = typer.Option('../app.territoiresentransitions.fr/build', "--client-new", "-cn"),
) -> None:
    """Upload files into a sub domain bucket"""
    s3 = make_s3_client()
    bucket = f'{subdomain}.territoiresentransitions.fr'
    count = upload_folder(bucket, app_dir, s3)
    typer.echo(f"Uploaded {count} files to '{bucket}'.")


def upload_folder(bucket: str, path: str, s3: BaseClient) -> int:
    count = 0
    filenames = []
    for root, dirs, files in os.walk(path):
        for filename in files:
            filenames.append(os.path.join(root, filename))

    typer.echo(f"Uploading {len(filenames)} files from {path} to '{bucket}'.")
    with typer.progressbar(filenames) as progress:
        for filename in progress:
            name = filename.lstrip(path)
            if os.name == 'nt':
                name = name.replace("\\", "/")[1:]  # replace slashes and remove the preceding slash
            
            s3.upload_file(filename, bucket, name, ExtraArgs={'ACL': 'public-read'})
            count += 1
    return count
