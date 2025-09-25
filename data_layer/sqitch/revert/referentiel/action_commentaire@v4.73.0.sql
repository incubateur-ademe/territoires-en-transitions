-- Revert tet:referentiel/action_commentaire from pg

BEGIN;

drop table action_commentaire;

COMMIT;
