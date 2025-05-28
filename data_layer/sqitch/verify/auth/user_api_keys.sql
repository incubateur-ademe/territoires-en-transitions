-- Verify tet:auth/user_api_keys on pg

BEGIN;

select client_id,
    user_id,
    client_secret_hash,
    client_secret_truncated,
    permissions,
    created_at,
    modified_at
from public.user_api_key
where false;

ROLLBACK;
