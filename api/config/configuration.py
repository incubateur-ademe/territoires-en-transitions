"""Some vars"""
from os import environ

PORT = int(environ.get("PORT", '8080'))
