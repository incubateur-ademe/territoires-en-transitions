-- Verify tet:indicateur/referentiel on pg

BEGIN;

select indicateur_id, collectivite_id, user_id, tag_id
from indicateur_pilote
where false;

select indicateur_id, collectivite_id, service_tag_id
from indicateur_service_tag
where false;


ROLLBACK;
