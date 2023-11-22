-- Deploy tet:text_search_config to pg

BEGIN;

-- ajoute la configuration "fr" pour enlever les accents lors des requêtes FTS
-- Ref: https://www.postgresql.org/docs/current/unaccent.html
create text search configuration fr ( copy = french );
alter text search configuration fr
        alter mapping for hword, hword_part, word
        with french_stem, unaccent;

set default_text_search_config = 'fr';

COMMIT;
