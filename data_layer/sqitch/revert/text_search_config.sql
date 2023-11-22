-- Revert tet:text_search_config from pg

BEGIN;

set default_text_search_config = 'english';
drop text search configuration if exists fr;

COMMIT;
