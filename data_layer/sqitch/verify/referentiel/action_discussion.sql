-- Verify tet:referentiel/action_discussion on pg

BEGIN;

select id, collectivite_id, action_id, created_by, created_at, modified_at, status
from action_discussion
where false;

select collectivite_id, action_id, commentaire, modified_by, modified_at
from action_commentaire
where false;

ROLLBACK;
