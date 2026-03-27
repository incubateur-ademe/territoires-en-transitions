-- Deploy tet:referentiel/drop_comparaison_scores_audit_type_tabular_score to pg
-- requires: referentiel/drop_action_information_rpcs

BEGIN;

DROP MATERIALIZED VIEW IF EXISTS public.action_referentiel;

COMMIT;
