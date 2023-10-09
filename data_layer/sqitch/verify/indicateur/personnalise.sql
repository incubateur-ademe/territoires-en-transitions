-- Verify tet:indicateur/personnalise on pg

BEGIN;

select indicateur_id, thematique
from indicateur_personnalise_thematique
where false;

select indicateur_id, user_id, tag_id
from indicateur_personnalise_pilote
where false;

select indicateur_id, service_tag_id
from indicateur_personnalise_service_tag
where false;

select has_function_privilege('private.indicateur_personnalise_collectivite_id(integer)', 'execute');

ROLLBACK;
