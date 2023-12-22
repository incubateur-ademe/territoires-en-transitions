-- Verify tet:indicateur/referentiel on pg

BEGIN;

select modified_by
from indicateur_resultat
where false;

select modified_by
from indicateur_objectif
where false;


ROLLBACK;
