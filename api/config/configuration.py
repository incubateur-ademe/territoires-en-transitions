"""Some vars"""
from os import environ

IS_PROD = environ.get("PRODUCTION", '') == 'yes'
FASTAPI_PORT = int(environ.get("FASTAPI_PORT", '8080'))
