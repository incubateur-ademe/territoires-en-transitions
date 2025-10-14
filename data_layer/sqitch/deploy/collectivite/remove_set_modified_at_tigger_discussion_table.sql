-- Deploy tet:collectivite/remove_set_modified_at_tigger_discussion_table to pg


BEGIN;

drop trigger set_modified_at on discussion;

COMMIT;
