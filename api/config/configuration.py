"""Some vars"""
from os import environ

IS_PROD = environ.get("PRODUCTION", '') == 'yes'
PORT = int(environ.get("PORT", '8080'))
