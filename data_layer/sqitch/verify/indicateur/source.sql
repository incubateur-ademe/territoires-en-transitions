-- Verify tet:indicateur/source on pg

BEGIN;

select collectivite_id, indicateur_id, annee, valeur, modified_at, source, source_id
from indicateur_resultat_import where false;

ROLLBACK;
