-- Verify tet:client_scores on pg

BEGIN;

select collectivite_id, referentiel, modified_at
from client_scores_update
where false;

select has_function_privilege('evaluation.after_scores_write()', 'execute');

ROLLBACK;
