-- Verify tet:utilisateur/usage on pg

BEGIN;

select time, fonction, action, page, user_id, collectivite_id
from usage
where false;

ROLLBACK;
