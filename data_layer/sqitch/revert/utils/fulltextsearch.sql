-- Revert tet:utils/fulltextsearch from pg

BEGIN;

ALTER TABLE indicateur_definition
    DROP COLUMN IF EXISTS fulltext_search;

DROP TEXT SEARCH CONFIGURATION IF EXISTS french_custom;

COMMIT;
