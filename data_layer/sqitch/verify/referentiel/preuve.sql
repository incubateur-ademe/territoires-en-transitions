-- Verify tet:referentiel/preuve on pg

BEGIN;

select collectivite_id, action_id, file_id, commentaire
from preuve_fichier
where false;

select has_function_privilege('after_collectivite_insert_create_bucket()', 'execute');
select has_function_privilege('upsert_preuve_fichier(integer, action_id, text, text)', 'execute');
select has_function_privilege('delete_preuve_fichier(integer, action_id, text)', 'execute');

select collectivite_id, bucket_id, action_id, filename, path, commentaire
from action_preuve_fichier
where false;

select has_function_privilege('remove_preuve_fichier()', 'execute');

select id, collectivite_id, action_id, url, titre, commentaire
from preuve_lien
where false;

select type,
       id,
       action_id,
       collectivite_id,
       commentaire,
       filename,
       bucket_id,
       path,
       url,
       titre
from preuve
where false;


ROLLBACK;
