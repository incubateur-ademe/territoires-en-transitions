-- Verify tet:evaluation/consequence on pg

BEGIN;

select modified_at, collectivite_id, consequences
from personnalisation_consequence
where false;

ROLLBACK;
