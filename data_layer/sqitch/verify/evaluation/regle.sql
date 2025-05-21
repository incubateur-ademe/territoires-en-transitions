-- Verify tet:evaluation/regle on pg

BEGIN;

select action_id, type, formule, description
from personnalisation_regle
where false;

ROLLBACK;
