-- Verify tet:labellisation/fichier_preuve on pg

BEGIN;

select *
from labellisation_preuve_fichier
where false;

select has_function_privilege('upsert_labellisation_preuve_fichier(integer, integer, text, text)', 'execute');

select collectivite_id, bucket_id, demande_id, filename, path, commentaire
from action_labellisation_preuve_fichier
where false;

select has_function_privilege('remove_labellisation_preuve_fichier()', 'execute');
select has_function_privilege('labellisation.critere_fichier(integer)', 'execute');

ROLLBACK;
