-- Verify tet:text_search_config on pg

BEGIN;

comment on text search configuration fr is null;

ROLLBACK;
