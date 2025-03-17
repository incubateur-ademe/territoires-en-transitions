-- Deploy tet:plan_action/fiches to pg

BEGIN;

DROP INDEX epci_nom_gin_trgm_ops_idx;
DROP INDEX commune_nom_gin_trgm_ops_idx;

COMMIT;
