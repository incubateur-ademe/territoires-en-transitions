from api.config.configuration import (
    AUTH_KEYCLOAK,
    AUTH_REALM,
    AUTH_USER_API,
)

token_endpoint = (
    f"{AUTH_KEYCLOAK}/auth/realms/{AUTH_REALM}/protocol/openid-connect/token"
)

token_endpoint = (
    f"{AUTH_KEYCLOAK}/auth/realms/{AUTH_REALM}/protocol/openid-connect/token"
)
auth_endpoint = f"{AUTH_KEYCLOAK}/auth/realms/{AUTH_REALM}/protocol/openid-connect/auth"
certs_endpoint = (
    f"{AUTH_KEYCLOAK}/auth/realms/{AUTH_REALM}/protocol/openid-connect/certs"
)
userinfo_endpoint = (
    f"{AUTH_KEYCLOAK}/auth/realms/{AUTH_REALM}/protocol/openid-connect/userinfo"
)
users_endpoint = f"{AUTH_USER_API}/api/users"
count_endpoint = f"{AUTH_USER_API}/api/supervision/count"
