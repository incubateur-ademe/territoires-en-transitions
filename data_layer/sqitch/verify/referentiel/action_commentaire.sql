-- Verify tet:referentiel/action_commentaire on pg

BEGIN;

select collectivite_id, action_id, commentaire, modified_by, modified_at
from action_commentaire
where false;

ROLLBACK;
