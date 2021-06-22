import jwt
import requests
from fastapi import APIRouter, Response, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from starlette import status
from starlette.responses import JSONResponse

from api.config.configuration import AUTH_KEYCLOAK, AUTH_REALM, AUTH_CLIENT_ID, AUTH_SECRET, AUTH_USER_API
from api.models.pydantic.utilisateur_connecte import UtilisateurConnecte
from api.models.pydantic.utilisateur_inscription import UtilisateurInscription
from api.models.tortoise.utilisateur import Utilisateur

router = APIRouter(prefix='/v2/auth')

token_endpoint = f'{AUTH_KEYCLOAK}/auth/realms/{AUTH_REALM}/protocol/openid-connect/token'
auth_endpoint = f'{AUTH_KEYCLOAK}/auth/realms/{AUTH_REALM}/protocol/openid-connect/auth'
certs_endpoint = f'{AUTH_KEYCLOAK}/auth/realms/{AUTH_REALM}/protocol/openid-connect/certs'
users_endpoint = f'{AUTH_USER_API}/api/users'
count_endpoint = f'{AUTH_USER_API}/api/supervision/count'

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=token_endpoint)


@router.post('/register', response_class=JSONResponse)
async def register(inscription: UtilisateurInscription, response: Response):
    """Register a new user"""
    # retrieve a service token to call ADEME users API
    token_parameters = {
        'client_id': AUTH_CLIENT_ID,
        'client_secret': AUTH_SECRET,
        'grant_type': 'client_credentials',
    }
    token_response = requests.post(token_endpoint, data=token_parameters)

    if not token_response.ok:
        raise HTTPException(status_code=503, detail=f'{token_response.status_code} {token_endpoint}')

    token_json = token_response.json()
    access_token = token_json['access_token']

    # use the ADEME user API using our token
    headers = {'Authorization': 'Bearer ' + access_token}
    users_response = requests.post(users_endpoint, json=inscription.to_registration().dict(), headers=headers)

    if not users_response.ok:
        # forward error for now.
        print(f"{users_response.status_code} {users_response.reason} {users_response.text}")
        try:
            raise HTTPException(status_code=503, detail=users_response.json())
        except:
            raise HTTPException(status_code=503,
                                detail={'message': users_response.text, 'reason': users_response.reason})

    user_data = users_response.json()
    user_id = user_data['userId']

    # add the created user to our db.
    await Utilisateur.create(ademe_user_id=user_id, vie_privee=inscription.vie_privee)

    try:
        requests.put(f'{users_endpoint}/{user_id}/enableCGU', headers=headers)
    except:
        # there is no consequence of enableCGU failing, we are just being nice.
        pass

    return user_data


@router.get('/token', response_class=JSONResponse)
async def token(code: str, redirect_uri: str, response: Response):
    """Returns a token from a code"""
    parameters = {
        'client_id': AUTH_CLIENT_ID,
        'client_secret': AUTH_SECRET,
        'grant_type': 'authorization_code',
        'redirect_uri': redirect_uri,
        'code': code,
    }
    token_response = requests.post(token_endpoint, parameters)

    if token_response.ok:
        return token_response.json()

    raise HTTPException(status_code=400,
                        detail={'content': token_response.content})


async def get_user_from_header(token: str = Depends(oauth2_scheme)) -> UtilisateurConnecte:
    try:
        # fixme: both jwt and jose libraries fail at verifying access token using keycloak's JWKs
        payload = jwt.decode(token, options={"verify_signature": False})

        user = UtilisateurConnecte(
            ademe_user_id=payload.get('sub', ''),
            prenom=payload.get('given_name', ''),
            nom=payload.get('family_name', ''),
            email=payload.get('email', ''),
            access_token=token,
            refresh_token=''
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.get('/identity', response_model=UtilisateurConnecte)
async def get_current_user(utilisateur: UtilisateurConnecte = Depends(get_user_from_header)):
    """Return the identity of the currently authenticated user"""
    return utilisateur


@router.get('/supervision/count', response_class=JSONResponse)
async def supervision_count():
    """Compter le nombre d'utilisateurs en base (permet de tester la connexion a l'API de l'ADEME)"""
    count_response = requests.get(count_endpoint)

    if not count_response.ok:
        # forward error for now.
        print(f"{count_response.status_code} {count_response.reason} {count_response.text}")
        raise HTTPException(status_code=503, detail=count_response.text)

    return {'count': count_response.text}
