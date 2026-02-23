-- Verify tet:collectivite/preferences on pg

BEGIN;

select preferences
from collectivite
where false;

ROLLBACK;
