-- Verify tet:referentiel/add_action_origine_texte on pg

BEGIN;

select referentiel_id, action_id, origine_referentiel_id, origine_action_id
from action_origine_texte
where false;

ROLLBACK;
