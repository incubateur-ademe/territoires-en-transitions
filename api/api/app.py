from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise

from api.config import openapi_config, tortoise_config
from api.routers.v1 import mesure_custom, fiche_action, indicateur_referentiel_commentaire, action_status, \
    fiche_action_categorie, indicateur_value, action_custom, indicateur_personnalise, indicateur_personnalise_value
from api.routers.v2 import auth

app = FastAPI(
    title=openapi_config.name,
    version=openapi_config.version,
    description=openapi_config.description,
)
app.include_router(action_custom.router)
app.include_router(action_status.router)
app.include_router(mesure_custom.router)
app.include_router(indicateur_value.router)
app.include_router(fiche_action.router)
app.include_router(fiche_action_categorie.router)
app.include_router(indicateur_personnalise.router)
app.include_router(indicateur_personnalise_value.router)
app.include_router(indicateur_referentiel_commentaire.router)
app.include_router(auth.router)

register_tortoise(
    app,
    db_url=tortoise_config.db_url,
    generate_schemas=tortoise_config.generate_schemas,
    modules=tortoise_config.modules,
)

app.add_middleware(
    CORSMiddleware,
    # FIXME not safe
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
