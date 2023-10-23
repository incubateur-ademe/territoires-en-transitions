-- Deploy tet:utils/automatisation to pg

BEGIN;

drop view crm_collectivites;

create view crm_collectivites
as
select nom || ' (' || collectivite_id || ')' as key,
       collectivite_id,
       nom,
       type_collectivite,
       nature_collectivite,
       code_siren_insee,
       region_name,
       region_code,
       departement_name,
       departement_code,
       population_totale,
       coalesce(c.actif, false)              as cot
from stats.collectivite
         left join cot c using (collectivite_id)
where is_service_role();

COMMIT;
