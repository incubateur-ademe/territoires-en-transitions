-- Deploy tet:collectivite/departement to pg
-- requires: collectivite/imports

BEGIN;

create or replace view departement
as
select code, libelle, region_code
from imports.departement
order by code;

COMMIT;
