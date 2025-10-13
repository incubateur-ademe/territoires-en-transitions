-- Revert tet:collectivite/rename_commentaire_to_discussion from pg

BEGIN;

alter table discussion_message
    rename to action_discussion_commentaire;

alter table discussion
    rename to action_discussion;

COMMIT;
