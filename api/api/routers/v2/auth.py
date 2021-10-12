from dataclasses import asdict
from api.utils.connection_api import (
    AddressAlreadyExists,
    AdemeConnectionApi,
    DummyConnectionApi,
    GetTokenError,
)
from typing import List

from fastapi import APIRouter
from fastapi import Depends, HTTPException
from fastapi import Response
from starlette.responses import JSONResponse
from tortoise.exceptions import DoesNotExist

from api.config.configuration import AUTH_DISABLED_DUMMY_USER
from api.config.configuration import (
    AUTH_KEYCLOAK,
    AUTH_REALM,
    AUTH_CLIENT_ID,
    AUTH_SECRET,
)
from fastapi.security import OAuth2PasswordBearer
from api.models.pydantic.utilisateur_connecte import (
    UtilisateurConnecte as UtilisateurConnecteModel,
)
from api.models.pydantic.utilisateur_inscription import UtilisateurInscription
from api.models.tortoise.utilisateur import Utilisateur
from api.models.tortoise.utilisateur_droits import (
    UtilisateurDroits_Pydantic,
    UtilisateurDroits,
)
from api.models.tortoise.utilisateur_connecte import (
    UtilisateurConnecte as UtilisateurConnecteTortoise,
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
        return asdict(register_response_data)

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
        connected_user = await connection_api.get_connected_user(access_token)
        await update_connected_user_in_db(connected_user)
        return asdict(tokens)
    except GetTokenError as e:
        raise HTTPException(status_code=400, detail={"content": str(e)})


async def update_connected_user_in_db(utilisateur_connecte: UtilisateurConnecteModel):
    query = UtilisateurConnecteTortoise.filter(
        ademe_user_id=utilisateur_connecte.ademe_user_id,
    )

    utilisateur_connecte_kwargs = utilisateur_connecte.dict()
    if await query.exists():
        connected_user_tortoise = await query.update(**utilisateur_connecte_kwargs)
    else:
        connected_user_tortoise = await UtilisateurConnecteTortoise.create(
            **utilisateur_connecte_kwargs,
        )
    return connected_user_tortoise


@router.get("/supervision/count", response_class=JSONResponse)
async def supervision_count():
    """Compter le nombre d'utilisateurs en base (permet de tester la connexion a l'API de l'ADEME)"""
    supervision_count_response = connection_api.get_supervision_count()
    if not supervision_count_response:
        raise HTTPException(status_code=503)


async def get_user_from_header(
    token: str = Depends(oauth2_scheme),
) -> UtilisateurConnecteModel:
    """Retrieve user info from header."""
    connected_user = await connection_api.get_connected_user(token)
    return connected_user


async def get_utilisateur_droits_from_header(
    token: str = Depends(oauth2_scheme),
) -> List[UtilisateurDroits_Pydantic,]:
    """Retrieve the token bearer list of droits"""
    connected_user = await connection_api.get_connected_user(token)
    if not connected_user:
        raise HTTPException(status_code=401, detail="user not connected")
    ademe_user_id = connected_user.ademe_user_id
    query = UtilisateurDroits.filter(ademe_user_id=ademe_user_id)
    try:
        return await UtilisateurDroits_Pydantic.from_queryset(query)
    except DoesNotExist as error:
        raise HTTPException(status_code=401, detail=f"{ademe_user_id} droits not found")
