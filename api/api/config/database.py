"""Config of DB"""
from os import environ

from config.base import BaseSettings

DB_MODELS = ["models.tortoise.action_custom", "models.tortoise.action_status",
             "models.tortoise.indicateur_value", "models.tortoise.mesure_custom", ]
SQLITE_DB_URL = "sqlite://:memory:"
DATABASE_URL = environ.get("DATABASE_URL", SQLITE_DB_URL)


class TortoiseSettings(BaseSettings):
    """Tortoise-ORM settings"""

    db_url: str
    modules: dict
    generate_schemas: bool

    @classmethod
    def generate(cls):
        """Generate Tortoise-ORM settings (with sqlite if tests)"""
        modules = {"models": DB_MODELS}
        return TortoiseSettings(db_url=DATABASE_URL, modules=modules, generate_schemas=True)
