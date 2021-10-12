import abc
from dataclasses import dataclass
import logging

from collections import deque
from datetime import timedelta
from typing import Optional

from fastapi import HTTPException
import jwt
from jose import JWTError
from memoize.configuration import DefaultInMemoryCacheConfiguration
from memoize.wrapper import memoize
import requests


from api.config.configuration import (
    AUTH_CLIENT_ID,
    AUTH_SECRET,
)
from api.models.pydantic.utilisateur_connecte import UtilisateurConnecte
from api.models.pydantic.utilisateur_inscription import UtilisateurInscription


logger = logging.getLogger()


# Ports : API specification
# ======


@dataclass
class RegisterResponseData:
    user_id: str


class InvalidToken(Exception):
    pass


class AddressAlreadyExists(Exception):
    pass


class SupervisionCountError(Exception):
    pass


class AbstractConnectionApi(abc.ABC):
    @abc.abstractmethod
    async def register(
        self, inscription: UtilisateurInscription
    ) -> RegisterResponseData:
        """Register a new user. Raises AddressAlreadyExists if so."""
        pass

    @abc.abstractmethod
    async def get_supervision_count(self) -> str:
        """Count nb of connection in base. Raises SupervisionCountError if any error."""
        pass

    @abc.abstractmethod
    async def get_connected_user(self, token: str) -> UtilisateurConnecte:
        """Get connected user"""
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
        self.user = UtilisateurConnecte(
            ademe_user_id=user_uid,
            access_token="lala",
            refresh_token="lala",
            email="lala",
            nom="dummy",
            prenom="lala",
        )

    async def register(
        self, inscription: UtilisateurInscription
    ) -> RegisterResponseData:
        if self._register_error is None:
            return RegisterResponseData(self.user_uid)
        raise Exception(self._register_error)

    async def get_supervision_count(self) -> str:
        if not self._api_down:
            return "42"
        raise SupervisionCountError()

    async def get_connected_user(self, token: str) -> UtilisateurConnecte:
        """Get connected user"""
        return self.user

    # For test purpose only
    def set_user_name(self, nom: str):
        self.user = UtilisateurConnecte(
            ademe_user_id=self.user_uid,
            access_token="lala",
            refresh_token="lala",
            email="lala",
            nom=nom,
            prenom="lala",
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
    ) -> Optional[UtilisateurConnecte]:
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            self.verified_token_cache.append(token)
            # TODO : sanity check on payload !
            user = UtilisateurConnecte(
                ademe_user_id=payload.get("sub", ""),
                prenom=payload.get("given_name", ""),
                nom=payload.get("family_name", ""),
                email=payload.get("email", ""),
                access_token=token,
                refresh_token="",
            )
        except JWTError:
            if token in self.verified_token_cache:
                self.verified_token_cache.remove(token)
            logger.warn("Could not get user from token ", token)
            raise InvalidToken()
        self.user = user
        return user

    async def get_connected_user(self, token: str):
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

            return RegisterResponseData(user_id)

        if users_response.status_code == 409:
            raise AddressAlreadyExists()

        # Log the error that we don't handle yet.
        error_message = f"Accountered unknown error in register: {users_response.status_code} {users_response.reason} {users_response.text}"
        logger.warn(error_message)
        raise Exception(error_message)

    async def get_supervision_count(self) -> Optional[str]:
        count_response = requests.get(count_endpoint)
        if not count_response.ok:
            error_message = (
                f"Could not get supervision count from ADEME : {count_response.text}"
            )
            logger.warning(error_message)
            raise SupervisionCountError(error_message)

        return count_response.text
