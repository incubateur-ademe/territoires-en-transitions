-- Revert tet:text_search_config from pg

BEGIN;

set default_text_search_config = 'public.english';
drop text search configuration if exists fr;
drop text search configuration if exists simpler;

COMMIT;
