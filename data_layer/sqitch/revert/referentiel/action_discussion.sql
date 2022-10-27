-- Revert tet:referentiel/action_discussion from pg

BEGIN;

drop table if exists test.action_discussion_commentaire cascade;
drop table if exists test.action_discussion cascade;

drop view action_discussion_feed;
drop table action_discussion_commentaire;
drop function supprimer_discussion();
drop table action_discussion;
drop function have_discussion_lecture_acces(integer);
drop function have_discussion_edition_acces(integer);
drop type action_discussion_statut;

COMMIT;
