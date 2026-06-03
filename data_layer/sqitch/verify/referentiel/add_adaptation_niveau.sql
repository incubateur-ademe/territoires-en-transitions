-- Verify tet:referentiel/add_adaptation_niveau on pg

BEGIN;

select adaptation_niveau
from action_definition
where false;

ROLLBACK;
