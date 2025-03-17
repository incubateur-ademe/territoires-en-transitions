-- Deploy tet:plan_action/fiches to pg

BEGIN;


-- Create a GIN index for faster trigram searches (enabled by the extension `pg_trgm`)
-- (slower to update but faster to search than a GIST index)
CREATE INDEX epci_nom_gin_trgm_ops_idx ON epci USING gin (nom gin_trgm_ops);
CREATE INDEX commune_nom_gin_trgm_ops_idx ON commune USING gin (nom gin_trgm_ops);


COMMIT;

