-- Verify tet:indicateur/referentiel on pg

BEGIN;

select indicateur_id, perso_id, collectivite_id, rempli
from indicateur_rempli
where false;

ROLLBACK;
