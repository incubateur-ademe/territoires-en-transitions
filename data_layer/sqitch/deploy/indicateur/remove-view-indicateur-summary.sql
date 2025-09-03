-- Deploy tet:indicateurs/remove-view-indicateur-summary to pg

BEGIN;

DROP VIEW indicateur_summary;

COMMIT;
