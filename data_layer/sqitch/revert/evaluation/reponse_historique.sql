-- Deploy tet:evaluation/reponse_history to pg
-- requires: evaluation/reponse
-- requires: history_schema

BEGIN;

drop function historique.reponses_at(int, timestamp with time zone);

COMMIT;
