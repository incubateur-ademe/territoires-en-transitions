-- Deploy tet:client_scores to pg
-- requires: referentiel
-- requires: base

BEGIN;

alter publication supabase_realtime add table client_scores;
drop table client_scores_update;
drop function evaluation.after_scores_write;

COMMIT;
