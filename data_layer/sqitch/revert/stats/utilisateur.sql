-- Revert tet:stats/utilisateur from pg

BEGIN;

drop view stats_unique_active_users;

COMMIT;
