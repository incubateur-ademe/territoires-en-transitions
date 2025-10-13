-- Deploy tet:collectivite/rename_commentaire_to_discussion to pg

BEGIN;

alter table action_discussion_commentaire
    rename to discussion_message;

alter table action_discussion
    rename to discussion;

COMMIT;
