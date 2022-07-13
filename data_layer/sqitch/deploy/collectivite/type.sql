-- Deploy tet:collectivite/type to pg
-- requires: collectivite/collectivite

BEGIN;

create type type_collectivite as enum ('EPCI', 'commune', 'syndicat');

COMMIT;
