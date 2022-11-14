-- Verify tet:indicateur/indicateur_terristory_json on pg

BEGIN;

select indicateurs, created_at
from indicateur_terristory_json
where false;

ROLLBACK;
