-- Verify tet:indicateur/detail on pg

BEGIN;

select collectivite_id, indicateur_id, indicateur_perso_id, nom, description, unite
from indicateur_definitions
where false;

ROLLBACK;
