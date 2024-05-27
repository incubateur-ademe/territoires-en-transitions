-- Deploy tet:indicateur/source to pg

BEGIN;

alter table indicateur_resultat_import
    drop constraint indicateur_resultat_import_collectivite_id_indicateur_id_an_key;
alter table indicateur_resultat_import
    add primary key (indicateur_id, collectivite_id, annee, source_id);

COMMIT;
