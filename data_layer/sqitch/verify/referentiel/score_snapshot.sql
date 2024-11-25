-- Verify tet:referentiel/score_snapshot on pg

BEGIN;

select collectivite_id, referentiel_id, audit_id, date, ref, nom, type_jalon, point_fait, point_programme, point_pas_fait, point_potentiel, referentiel_scores, personnalisation_reponses, created_by, created_at, modified_by, modified_at
from score_snapshot
where false;

select has_function_privilege('automatisation.save_score_snapshot(int, referentiel, varchar, int)', 'execute');
select has_function_privilege('public.after_client_scores_save_snapshot()', 'execute');
select has_function_privilege('public.after_post_audit_scores_save_snapshot()', 'execute');
select has_function_privilege('public.after_pre_audit_scores_save_snapshot()', 'execute');

ROLLBACK;
