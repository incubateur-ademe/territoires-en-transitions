-- Revert tet:referentiel/add_action_origine_texte from pg

BEGIN;

drop table action_origine_texte;

COMMIT;
