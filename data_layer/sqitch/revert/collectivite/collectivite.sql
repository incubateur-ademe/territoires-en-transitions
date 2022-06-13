-- Revert tet:collectivites from pg

BEGIN;

drop view named_collectivite;
drop table collectivite_test;
drop table commune;
drop table epci;
drop function before_write_create_collectivite;
drop table collectivite;
drop extension unaccent;

COMMIT;
