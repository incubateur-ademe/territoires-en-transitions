from typing import List

from fastapi import APIRouter
from fastapi import Depends, HTTPException
from fastapi import Response
from fastapi.security import OAuth2PasswordBearer
from starlette.responses import JSONResponse
from tortoise.exceptions import DoesNotExist

from api.config.configuration import AUTH_DISABLED_DUMMY_USER
from api.config.configuration import (
    AUTH_KEYCLOAK,
    AUTH_REALM,
)
from api.models.pydantic.ademe_utilisateur import (
    AdemeUtilisateur as AdemeUtilisateurModel,
)
from api.models.pydantic.utilisateur_inscription import UtilisateurInscription
from api.models.tortoise.ademe_utilisateur import (
    AdemeUtilisateur as AdemeUtilisateurTortoise,
)
from api.models.tortoise.utilisateur import Utilisateur
from api.models.tortoise.utilisateur_droits import (
    UtilisateurDroits_Pydantic,
    UtilisateurDroits,
)
from api.utils.connection_api import (
    AddressAlreadyExists,
    AdemeConnectionApi,
    DummyConnectionApi,
    GetTokenError,
)

router = APIRouter(prefix="/v2/auth")

token_endpoint = (
    f"{AUTH_KEYCLOAK}/auth/realms/{AUTH_REALM}/protocol/openid-connect/token"
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=token_endpoint)

connection_api = (
    DummyConnectionApi() if AUTH_DISABLED_DUMMY_USER else AdemeConnectionApi()
)


def can_write_epci(epci_id: str, droits: List[UtilisateurDroits_Pydantic]) -> bool:
    """Returns true if there is a match in a list of droits for epci_id"""
    return bool(
        [droit for droit in droits if droit.epci_id == epci_id and droit.ecriture]
    )


@router.post("/register", response_class=JSONResponse)
async def register(inscription: UtilisateurInscription, response: Response):
    """Register a new user"""
    try:
        register_response_data = await connection_api.register(inscription)
        user_id = register_response_data.user_id
        await Utilisateur.create(
            ademe_user_id=user_id,
            vie_privee_conditions=inscription.vie_privee_conditions,
        )
        return register_response_data.dict()

    except AddressAlreadyExists:
        message = "L'adresse Email que vous avez renseigné dispose déjà d'un compte utilisateur.\n \
    #         Vous pouvez vous rendre directement à la page de connexion pour accéder à votre compte."
        reason = "address_already_exists"
    except Exception as e:
        message = str(e)
        reason = "unknown"
    raise HTTPException(
        status_code=503,
        detail={
            "message": message,
            "reason": reason,
        },
    )


@router.get("/token", response_class=JSONResponse)
async def token(code: str, redirect_uri: str, response: Response):
    """Returns a token from a code"""
    try:
        tokens = connection_api.get_tokens(code, redirect_uri)
        access_token = tokens.access_token
        ademe_user = await connection_api.get_ademe_user(access_token)
        await update_ademe_user_in_db(ademe_user)
        return tokens.dict()
    except GetTokenError as e:
        raise HTTPException(status_code=400, detail={"content": str(e)})


async def update_ademe_user_in_db(ademe_user: AdemeUtilisateurModel):
    query = AdemeUtilisateurTortoise.filter(
        ademe_user_id=ademe_user.ademe_user_id,
    )

    ademe_user_kwargs = ademe_user.dict()
    if await query.exists():
        ademe_user_tortoise = await query.update(**ademe_user_kwargs)
    else:
        ademe_user_tortoise = await AdemeUtilisateurTortoise.create(
            **ademe_user_kwargs,
        )
    return ademe_user_tortoise


@router.get("/supervision/count", response_class=JSONResponse)
async def supervision_count():
    """Compter le nombre d'utilisateurs en base (permet de tester la connexion a l'API de l'ADEME)"""
    supervision_count_response = connection_api.get_supervision_count()
    if not supervision_count_response:
        raise HTTPException(status_code=503)


async def get_user_from_header(
    token: str = Depends(oauth2_scheme),
) -> AdemeUtilisateurModel:
    """Retrieve user info from header."""
    ademe_user = await connection_api.get_ademe_user(token)
    return ademe_user


async def get_utilisateur_droits_from_header(
    token: str = Depends(oauth2_scheme),
) -> List[UtilisateurDroits_Pydantic,]:
    """Retrieve the token bearer list of droits"""
    ademe_user = await connection_api.get_ademe_user(token)
    if not ademe_user:
        raise HTTPException(status_code=401, detail="user not connected")
    ademe_user_id = ademe_user.ademe_user_id
    query = UtilisateurDroits.filter(ademe_user_id=ademe_user_id)
    try:
        return await UtilisateurDroits_Pydantic.from_queryset(query)
    except DoesNotExist as error:
        raise HTTPException(status_code=401, detail=f"{ademe_user_id} droits not found")
