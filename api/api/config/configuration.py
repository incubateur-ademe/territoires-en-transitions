"""Environment variables"""
from os import environ

PORT = int(environ.get("PORT", '8000'))
AUTH_CLIENT_ID = environ.get("AUTH_CLIENT_ID", "territoiresentransitions")
AUTH_KEYCLOAK = environ.get("AUTH_KEYCLOAK", "https://moncompte.ademe.fr")
AUTH_SECRET = environ.get("AUTH_SECRET", "")
AUTH_REALM = environ.get("AUTH_REALM", "master")
AUTH_USER_API = environ.get("AUTH_USER_API", "https://prod-fa-api.ademe-dri.fr")
AUTH_DISABLED_DUMMY_USER = environ.get("AUTH_DISABLED_DUMMY_USER", "") == "YES"
