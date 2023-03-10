-- Revert tet:indicateur/referentiel from pg

BEGIN;

drop table indicateur_commentaire;
drop table indicateur_objectif;
drop table indicateur_resultat;
drop table abstract_any_indicateur_value;

COMMIT;
