from tools.utils.s3 import make_s3_client


def test_make_s3_client():
    s3 = make_s3_client()
    buckets = s3.list_buckets()['Buckets']
    assert buckets
