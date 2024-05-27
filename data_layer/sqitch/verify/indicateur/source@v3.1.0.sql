-- Verify tet:indicateur/source on pg

BEGIN;

select id, libelle
from indicateur_source where false;

ROLLBACK;
