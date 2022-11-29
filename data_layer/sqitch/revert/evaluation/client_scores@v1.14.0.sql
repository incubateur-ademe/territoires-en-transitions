-- Revert tet:client_scores from pg

BEGIN;

drop table client_scores;

COMMIT;
