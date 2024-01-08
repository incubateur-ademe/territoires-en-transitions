-- Verify tet:indicateur/source on pg

BEGIN;

select id, libelle
from indicateur_source where false;

select has_function_privilege('import_sources(indicateur_definitions)', 'execute');

select collectivite_id, indicateur_id, annee, valeur, modified_at, source, source_id
from indicateur_resultat_import
where false;

ROLLBACK;
