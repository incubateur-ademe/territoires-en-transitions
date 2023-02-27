-- Deploy tet:referentiel to pg

BEGIN;

alter table indicateur_definition
    drop column valeur_seuil,
    drop column valeur_cible;

COMMIT;
