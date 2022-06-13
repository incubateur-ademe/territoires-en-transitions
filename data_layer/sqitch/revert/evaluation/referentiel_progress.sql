-- Revert tet:evaluation/referentiel_progress from pg

BEGIN;

drop function private.referentiel_progress(collectivite_id integer);

COMMIT;
