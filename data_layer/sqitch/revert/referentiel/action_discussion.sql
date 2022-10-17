-- Revert tet:referentiel/action_discussion from pg

BEGIN;

drop table action_commentaire;
drop table action_discussion;
drop type action_discussion_statut;

COMMIT;
