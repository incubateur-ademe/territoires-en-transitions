-- Verify tet:collectivite/service_etat_noms_acronyme on pg

BEGIN;

select 1 / (case when count(*) = 0 then 1 else 0 end)
from collectivite
where type = 'dreal'
  and siren is not null
  and nom like 'Direction%';

ROLLBACK;
