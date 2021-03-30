"""Application config"""
from .database import TortoiseSettings
from .openapi import OpenAPISettings

tortoise_config = TortoiseSettings.generate()
openapi_config = OpenAPISettings.generate()
