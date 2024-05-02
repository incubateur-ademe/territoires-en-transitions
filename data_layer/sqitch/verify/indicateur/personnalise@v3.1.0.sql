-- Verify tet:indicateur/personnalise on pg

BEGIN;

select modified_by
from indicateur_personnalise_resultat
where false;

select modified_by
from indicateur_personnalise_objectif
where false;

ROLLBACK;
