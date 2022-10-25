-- Revert tet:referentiel/action_discussion from pg

BEGIN;

drop view action_discussion_feed;
drop function supprimer_discussion();
drop table action_discussion_commentaire;
drop table action_discussion;
drop type action_discussion_statut;

COMMIT;
