-- Revert tet:text_search_config from pg

BEGIN;

drop text search configuration if exists fr;

COMMIT;
