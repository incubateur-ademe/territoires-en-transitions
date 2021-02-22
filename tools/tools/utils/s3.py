# noinspection PyUnresolvedReferences
from typing import List, Dict

import boto3


def make_s3_client():
    """Make a S3 client configured for Scaleway"""
    session = boto3.session.Session()

    return session.client(
        service_name='s3',
        endpoint_url='https://s3.fr-par.scw.cloud',
    )
