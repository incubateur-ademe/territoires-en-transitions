-- Verify tet:utilisateur/membre on pg

BEGIN;


select user_id, collectivite_id, fonction, details_fonction, champ_intervention, created_at, modified_at
from private_collectivite_membre
where false;


select has_function_privilege('update_collectivite_membre_details_fonction(integer, uuid, text)', 'execute');
select has_function_privilege('update_collectivite_membre_fonction(integer, uuid, membre_fonction)', 'execute');
select has_function_privilege('update_collectivite_membre_champ_intervention(integer, uuid, referentiel[])', 'execute');
select has_function_privilege('update_collectivite_membre_niveau_acces(integer, uuid, niveau_acces)', 'execute');
select has_function_privilege('remove_membre_from_collectivite(integer, uuid)', 'execute');
select has_function_privilege('collectivite_membres(integer)', 'execute');

ROLLBACK;
