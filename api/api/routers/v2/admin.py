import secrets

import requests
from fastapi import Depends, APIRouter, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from tortoise.contrib.fastapi import HTTPNotFoundError

from api.config.configuration import AUTH_ADMIN_USER, AUTH_ADMIN_PASSWORD
from api.utils.endpoints import *
from api.utils.connection_api import get_authorization_header

router = APIRouter(prefix="/v2/admin")
security = HTTPBasic()


class AdemeUser(BaseModel):
    userId: str
    username: str
    lastname: str
    firstname: str
    email: str
    enabled: bool


@router.get(
    "/users/{ademe_user_id}",
    response_model=AdemeUser,
    responses={404: {"model": HTTPNotFoundError}},
)
async def get_user(
    ademe_user_id: str,
    credentials: HTTPBasicCredentials = Depends(security),
):
    """Forward to ADEME's users endpoint."""
    if not AUTH_ADMIN_USER or not AUTH_ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bad server configuration",
            headers={"WWW-Authenticate": "Basic"},
        )
    correct_username = secrets.compare_digest(credentials.username, AUTH_ADMIN_USER)
    correct_password = secrets.compare_digest(credentials.password, AUTH_ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )

    # retrieve a service token to call ADEME users API
    headers = await get_authorization_header()

    users_response = requests.get(
        f"{users_endpoint}/{ademe_user_id}",
        headers=headers,
    )

    if users_response.status_code == 200:
        return AdemeUser.parse_raw(users_response.content)
