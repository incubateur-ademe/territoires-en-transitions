-- Verify tet:evaluation/score_mise_a_jour on pg

BEGIN;

select collectivite_id, referentiel, scores, modified_at
from client_scores
where false;

select collectivite_id, latest, type
from evaluation.collectivite_latest_update clu
where false;

select collectivite_id,
       score,
       data,
       content,
       fresher_content,
       fresher_data,
       no_score,
       late
from evaluation.late_collectivite
where false;

select has_function_privilege('evaluation.update_late_collectivite_scores(int)', 'execute');

ROLLBACK;
