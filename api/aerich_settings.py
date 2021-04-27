from api.config import tortoise_config
from api.config.database import DB_MODELS

TORTOISE_ORM = {
    "connections": {"default": tortoise_config.db_url},
    "apps": {
        "models": {
            "models": DB_MODELS,
            "default_connection": "default",
        },
    },
}
