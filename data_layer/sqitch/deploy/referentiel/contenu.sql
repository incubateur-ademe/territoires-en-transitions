-- Deploy tet:referentiel to pg

BEGIN;

alter table indicateur_definition
    add column valeur_seuil float,
    add column valeur_cible float;

COMMIT;
