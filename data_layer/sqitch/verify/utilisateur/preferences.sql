-- Verify tet:utilisateur/preferences on pg

BEGIN;

select preferences
from dcp
where false;

ROLLBACK;
