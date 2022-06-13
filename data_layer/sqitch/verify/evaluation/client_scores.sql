-- Verify tet:client_scores on pg

BEGIN;

select collectivite_id, referentiel, scores, score_created_at
from client_scores
where false;

ROLLBACK;
