-- Verify tet:utils/automatisation on pg

BEGIN;

select key,
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
       cot,
       lab_cae_etoiles,
       lab_cae_programme,
       lab_cae_realise,
       lab_cae_annee,
       lab_eci_etoiles,
       lab_eci_programme,
       lab_eci_realise,
       lab_eci_annee
from crm_collectivites
where false;

ROLLBACK;
