-- Deploy tet:delete-referentiels-old-views to pg

BEGIN;

DROP FUNCTION IF EXISTS private.score_summary_of;

DROP VIEW IF EXISTS public.retool_score;
DROP VIEW IF EXISTS private.action_scores;

DROP VIEW IF EXISTS public.comparaison_scores_audit;
DROP FUNCTION IF EXISTS private.collectivite_score_comparaison;
DROP FUNCTION IF EXISTS private.collectivite_scores_pre_audit;
DROP FUNCTION IF EXISTS private.collectivite_scores;

DROP FUNCTION IF EXISTS labellisation.evaluate_audit_statuts;
DROP FUNCTION IF EXISTS labellisation.audit_personnalisation_payload;
DROP FUNCTION IF EXISTS evaluation.service_regles;
DROP VIEW IF EXISTS evaluation.service_regles;

DROP FUNCTION IF EXISTS labellisation.audit_evaluation_payload;
DROP MATERIALIZED VIEW IF EXISTS evaluation.service_referentiel;
DROP VIEW IF EXISTS evaluation.service_statuts;

DROP MATERIALIZED VIEW IF EXISTS stats.report_scores;
DROP VIEW IF EXISTS public.action_statuts;
DROP VIEW IF EXISTS public.export_score_audit;
DROP MATERIALIZED VIEW IF EXISTS labellisation.export_score_audit;
DROP FUNCTION IF EXISTS private.convert_client_scores;

DROP FUNCTION IF EXISTS private.to_tabular_score;
DROP FUNCTION IF EXISTS private.upsert_actions;
DROP FUNCTION IF EXISTS private.upsert_referentiel_after_json_insert;

DROP FUNCTION IF EXISTS test_write_scores;
DROP FUNCTION IF EXISTS test.generate_scores;
DROP VIEW IF EXISTS labellisation.action_snippet;
DROP FUNCTION IF EXISTS private.action_score;
DROP TABLE IF EXISTS private.action_score;

DROP FUNCTION IF EXISTS labellisation.update_audit_scores;
DROP FUNCTION IF EXISTS labellisation.update_audit_score_on_personnalisation;

DROP FUNCTION IF EXISTS labellisation.json_action_statuts_at;
DROP FUNCTION IF EXISTS historique.action_statuts_at;

DROP FUNCTION IF EXISTS public.labellisation_parcours;
DROP FUNCTION IF EXISTS labellisation.critere_score_global;
DROP FUNCTION IF EXISTS labellisation.referentiel_score;
DROP FUNCTION IF EXISTS labellisation.etoiles;

DROP VIEW IF EXISTS public.client_action_statut;
DROP VIEW IF EXISTS public.action_discussion_feed;
DROP VIEW IF EXISTS public.action_definition_summary;

DROP VIEW IF EXISTS public.retool_completude_compute;
DROP VIEW IF EXISTS public.action_children;

DROP FUNCTION IF EXISTS public.valider_audit;
DROP FUNCTION IF EXISTS public.labellisation_validate_audit;
DROP FUNCTION IF EXISTS public.labellisation_submit_demande;
DROP FUNCTION IF EXISTS public.labellisation_commencer_audit;
DROP FUNCTION IF EXISTS public.labellisation_cloturer_audit;

DROP FUNCTION IF EXISTS public.action_down_to_tache;


-- DROP TYPE IF EXISTS tabular_score;

COMMIT;
