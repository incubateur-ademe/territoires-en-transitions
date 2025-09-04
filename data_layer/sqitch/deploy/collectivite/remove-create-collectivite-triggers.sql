-- Deploy tet:collectivite/remove-create-collectivite-triggers to pg

BEGIN;

drop trigger before_epci_write on epci;
drop trigger before_commune_write on commune;
drop trigger before_collectivite_test_write on collectivite_test;
drop function before_write_create_collectivite;

COMMIT;
