-- Deploy tet:collectivite/remove_set_modified_at_trigger_discussion_table to pg


BEGIN;

drop trigger set_modified_at on discussion;

COMMIT;
