from urllib.parse import urlparse


def get_postgres_connection_params(postgres_url: str) -> dict:
    db_params = urlparse(postgres_url)

    return dict(
        dbname=db_params.path[1:],
        user=db_params.username,
        password=db_params.password,
        host=db_params.hostname,
        port=db_params.port,
    )
