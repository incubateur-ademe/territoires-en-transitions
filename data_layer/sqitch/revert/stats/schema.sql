-- Revert tet:stats/schema from pg

BEGIN;

-- On ne veut pas supprimer le schéma qui fait partie d'un fix.

COMMIT;
