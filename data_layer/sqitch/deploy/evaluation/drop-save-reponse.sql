-- Deploy tet:evaluation/drop-save-reponse to pg

BEGIN;

drop function if exists save_reponse(json);

COMMIT;
