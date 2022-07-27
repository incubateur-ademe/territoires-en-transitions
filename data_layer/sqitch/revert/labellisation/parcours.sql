-- Revert tet:labellisation/parcours from pg

BEGIN;

drop function labellisation_parcours(collectivite_id integer);

COMMIT;
