-- Deploy tet:collectivite/region to pg
-- requires: collectivite/imports

BEGIN;

create view region
as
select code, libelle
from imports.region
order by unaccent(libelle);

COMMIT;
