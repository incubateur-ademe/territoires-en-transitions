-- Verify tet:utilisateur/usage on pg

BEGIN;

select time, fonction, action, emplacement, user_id, collectivite_id
from usage
where false;

ROLLBACK;
