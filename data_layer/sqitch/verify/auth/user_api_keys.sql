-- Verify tet:auth/user_api_keys on pg

BEGIN;

select client_id,
    user_id,
    client_secret_hash,
    client_secret_truncated,
    restricted_permissions,
    created_at,
    modified_at
from auth.user_api_key
where false;

ROLLBACK;
