-- Revert tet:indicateur/cible_et_seuil from pg

BEGIN;

alter table indicateur_definition drop column expr_cible;
alter table indicateur_definition drop column expr_seuil;
alter table indicateur_definition drop column libelle_cible_seuil;

drop index unique_indicateur_objectif;
drop table indicateur_objectif;

COMMIT;
