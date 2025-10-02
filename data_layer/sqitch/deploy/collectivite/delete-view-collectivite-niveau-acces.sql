-- Deploy tet:collectivite/delete-view-collectivite-niveau-acces to pg

BEGIN;

DROP VIEW IF EXISTS collectivite_niveau_acces;

COMMIT;
