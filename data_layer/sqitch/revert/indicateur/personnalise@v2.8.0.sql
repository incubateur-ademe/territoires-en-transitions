-- Revert tet:indicateur/personnalise from pg

BEGIN;

drop table indicateur_personnalise_objectif;
drop table indicateur_personnalise_resultat;
drop table indicateur_personnalise_definition;

COMMIT;
