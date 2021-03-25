from fastapi import APIRouter

from config.configuration import IS_PROD
from config.database import PostgresSettings

router = APIRouter(
    prefix="/env",
)


@router.get("/variables", description="Get environments variables", response_description="Some text")
async def get():
    return {
        "PRODUCTION": IS_PROD,
        "POSTGRES_DB": PostgresSettings().postgres_db,
    }
