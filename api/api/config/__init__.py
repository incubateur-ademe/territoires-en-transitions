"""Application config"""
from api.config.database import TortoiseSettings
from api.config.openapi import OpenAPISettings

tortoise_config = TortoiseSettings.generate()
openapi_config = OpenAPISettings.generate()
