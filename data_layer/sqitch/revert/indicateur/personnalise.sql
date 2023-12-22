-- Deploy tet:indicateur/personnalise to pg

BEGIN;

drop trigger modified_by on indicateur_personnalise_resultat;
alter table indicateur_personnalise_resultat drop column modified_by;
drop trigger modified_by on indicateur_personnalise_objectif;
alter table indicateur_personnalise_objectif drop column modified_by;

COMMIT;
