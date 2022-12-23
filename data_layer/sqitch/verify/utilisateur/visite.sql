-- Verify tet:utilisateur/visite on pg

BEGIN;

select time, page, tag, onglet, user_id, collectivite_id
from visite
where false;

ROLLBACK;
