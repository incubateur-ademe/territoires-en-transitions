-- Deploy tet:utils/fulltextsearch to pg

BEGIN;

DROP TEXT SEARCH CONFIGURATION IF EXISTS french_custom;
CREATE TEXT SEARCH CONFIGURATION french_custom ( COPY=french );

ALTER TEXT SEARCH CONFIGURATION french_custom DROP MAPPING FOR email, sfloat, float, int, uint;

ALTER TEXT SEARCH CONFIGURATION french_custom ALTER MAPPING FOR hword, hword_part, word WITH unaccent, french_stem;

ALTER TABLE indicateur_definition
    ADD COLUMN IF NOT EXISTS fulltext_search tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('french_custom', coalesce(titre, '')), 'A') ||
        setweight(to_tsvector('french_custom', coalesce(titre_long, '')), 'A') ||
        setweight(to_tsvector('french_custom', coalesce(description, '')), 'B')
    ) STORED;

CREATE INDEX indicateur_definition_search_idx ON indicateur_definition USING GIN (fulltext_search);

COMMIT;
