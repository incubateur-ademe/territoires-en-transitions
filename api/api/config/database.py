"""Config of DB"""
from os import environ

from api.config.base import BaseSettings

DB_MODELS = [
    "aerich.models",
    "api.models.tortoise.action_custom",
    "api.models.tortoise.action_status",
    "api.models.tortoise.any_indicateur_values",
    "api.models.tortoise.mesure_custom",
    "api.models.tortoise.fiche_action",
    "api.models.tortoise.fiche_action_categorie",
    "api.models.tortoise.indicateur_personnalise",
    "api.models.tortoise.indicateur_referentiel_commentaire",
    "api.models.tortoise.utilisateur",
    "api.models.tortoise.plan_action",
    "api.models.tortoise.utilisateur_droits",
    "api.models.tortoise.utilisateur_connecte",
    "api.models.tortoise.epci",
    "api.models.tortoise.action_meta",
]
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
        return TortoiseSettings(
            db_url=DATABASE_URL, modules=modules, generate_schemas=True
        )
