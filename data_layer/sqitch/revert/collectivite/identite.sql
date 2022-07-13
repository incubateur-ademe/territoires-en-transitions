-- Revert tet:collectivite/identite from pg

BEGIN;

drop view collectivite_carte_identite;
drop view collectivite_identite;
drop function private.collectivite_type(collectivite_id integer);
drop function private.population_buckets(population integer);

COMMIT;
