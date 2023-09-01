-- Deploy tet:collectivite/region to pg
-- requires: collectivite/imports

BEGIN;

create or replace view region
as
select code, libelle
from imports.region
where is_authenticated()
ORDER BY departement.code;

COMMIT;
