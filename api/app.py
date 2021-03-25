from fastapi import FastAPI
from tortoise.contrib.fastapi import register_tortoise

from config import openapi_config, tortoise_config
from routers import hello, action_custom, action_status, mesure_custom, indicateur_value

app = FastAPI(
    title=openapi_config.name,
    version=openapi_config.version,
    description=openapi_config.description,
)
app.include_router(hello.router)
app.include_router(action_custom.router)
app.include_router(action_status.router)
app.include_router(mesure_custom.router)
app.include_router(indicateur_value.router)

register_tortoise(
    app,
    db_url=tortoise_config.db_url,
    generate_schemas=tortoise_config.generate_schemas,
    modules=tortoise_config.modules,
)
