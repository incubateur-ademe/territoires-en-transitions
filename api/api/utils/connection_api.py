import abc
import logging

from collections import deque
from datetime import timedelta
from typing import Dict, Optional

from fastapi import HTTPException
import jwt
from jose import JWTError
from memoize.configuration import DefaultInMemoryCacheConfiguration
from memoize.wrapper import memoize
from pydantic import BaseModel
import requests


from api.config.configuration import (
    AUTH_CLIENT_ID,
    AUTH_SECRET,
)
from api.models.pydantic.ademe_utilisateur import AdemeUtilisateur
from api.models.pydantic.utilisateur_inscription import UtilisateurInscription


logger = logging.getLogger()


# Data Transfert Object / Entities : defines types/interface. Some of them should be shared with client.
# =================================
class Tokens(BaseModel):
    access_token: str
    refresh_token: str


# Ports : API specification
# ======


class RegisterResponseData(BaseModel):
    user_id: str


class InvalidToken(Exception):
    pass


class AddressAlreadyExists(Exception):
    pass


class SupervisionCountError(Exception):
    pass


class GetTokenError(Exception):
    pass


class AbstractConnectionApi(abc.ABC):
    @abc.abstractmethod
    async def register(
        self, inscription: UtilisateurInscription
    ) -> RegisterResponseData:
        """Register a new user. Raises AddressAlreadyExists if so."""
        pass

    @abc.abstractmethod
    def get_supervision_count(self) -> str:
        """Count nb of connection in base. Raises SupervisionCountError if any error."""
        pass

    @abc.abstractmethod
    async def get_ademe_user(self, token: str) -> AdemeUtilisateur:
        """Get connected user"""
        pass

    @abc.abstractmethod
    def get_tokens(self, code: str, redirect_uri: str) -> Tokens:
        pass


# Adapters : API implementation
# ========
# Dummy
# -----
class DummyConnectionApi(AbstractConnectionApi):
    def __init__(self, user_uid: str = "dummy"):
        self._api_down = False
        self._register_error = None
        self.user_uid = user_uid
        self.user = AdemeUtilisateur(
            ademe_user_id=user_uid,
            email="lala",
            nom="dummy",
            prenom="lala",
        )

    async def register(
        self, inscription: UtilisateurInscription
    ) -> RegisterResponseData:
        if self._register_error is None:
            return RegisterResponseData(user_id=self.user_uid)
        raise Exception(self._register_error)

    def get_supervision_count(self) -> str:
        if not self._api_down:
            return "42"
        raise SupervisionCountError()

    async def get_ademe_user(self, token: str) -> AdemeUtilisateur:
        """Get connected user"""
        return self.user

    # For test purpose only
    def set_user_name(self, nom: str):
        self.user = AdemeUtilisateur(
            ademe_user_id=self.user_uid,
            email="lala",
            nom=nom,
            prenom="lala",
        )

    def get_tokens(self, code: str, redirect_uri: str) -> Tokens:
        return Tokens(
            access_token="dummy_access_token", refresh_token="dummy_refresh_token"
        )


# Ademe
# ------

from api.utils.endpoints import *


@memoize(
    configuration=DefaultInMemoryCacheConfiguration(
        update_after=timedelta(milliseconds=3000)
    )
)
async def get_authorization_header() -> dict:
    """Retrieve a service token to call ADEME users API"""
    token_parameters = {
        "client_id": AUTH_CLIENT_ID,
        "client_secret": AUTH_SECRET,
        "grant_type": "client_credentials",
    }
    token_response = requests.post(token_endpoint, data=token_parameters)

    if not token_response.ok:
        raise HTTPException(
            status_code=503, detail=f"{token_response.status_code} {token_endpoint}"
        )

    token_json = token_response.json()
    return {"Authorization": "Bearer " + token_json["access_token"]}


class AdemeConnectionApi(AbstractConnectionApi):
    def __init__(self) -> None:
        super().__init__()
        self.verified_token_cache = deque(
            maxlen=1000
        )  # cache verified tokens to limit calls to ADEME keycloak

    async def set_connected_user_from_token(
        self, token: str
    ) -> Optional[AdemeUtilisateur]:
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            self.verified_token_cache.append(token)
            # TODO : sanity check on payload !
            user = AdemeUtilisateur(
                ademe_user_id=payload.get("sub", ""),
                prenom=payload.get("given_name", ""),
                nom=payload.get("family_name", ""),
                email=payload.get("email", ""),
            )
        except JWTError:
            if token in self.verified_token_cache:
                self.verified_token_cache.remove(token)
            logger.warn("Could not get user from token ", token)
            raise InvalidToken()
        self.user = user
        return user

    async def get_ademe_user(self, token: str):
        await self.set_connected_user_from_token(token)
        return self.user

    async def register(
        self, inscription: UtilisateurInscription
    ) -> RegisterResponseData:
        # use the ADEME user API using our token
        headers = await get_authorization_header()
        users_response = requests.post(
            users_endpoint, json=inscription.to_registration().dict(), headers=headers
        )

        if users_response.ok:
            user_data = users_response.json()
            user_id = user_data["userId"]

            try:
                requests.put(f"{users_endpoint}/{user_id}/enableCGU", headers=headers)
            except Exception as e:
                # there is no consequence of enableCGU failing, we are just being nice.
                logger.warn(f"Could not enable CGU for user {user_id}: {str(e)}")

            return RegisterResponseData(user_id=user_id)

        if users_response.status_code == 409:
            raise AddressAlreadyExists()

        # Log the error that we don't handle yet.
        error_message = f"Accountered unknown error in register: {users_response.status_code} {users_response.reason} {users_response.text}"
        logger.warn(error_message)
        raise Exception(error_message)

    def get_supervision_count(self) -> Optional[str]:
        count_response = requests.get(count_endpoint)
        if not count_response.ok:
            error_message = (
                f"Could not get supervision count from ADEME : {count_response.text}"
            )
            logger.warning(error_message)
            raise SupervisionCountError(error_message)

        return count_response.text

    def get_tokens(self, code: str, redirect_uri: str) -> Tokens:
        parameters = {
            "client_id": AUTH_CLIENT_ID,
            "client_secret": AUTH_SECRET,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
            "code": code,
        }

        token_response = requests.post(token_endpoint, parameters)
        if token_response.ok:
            token_response_json = token_response.json()
            access_token = token_response_json.get("access_token")
            refresh_token = token_response_json.get("refresh_token")
            if access_token and refresh_token:
                return Tokens(access_token=access_token, refresh_token=refresh_token)
        raise GetTokenError(token_response.content)
