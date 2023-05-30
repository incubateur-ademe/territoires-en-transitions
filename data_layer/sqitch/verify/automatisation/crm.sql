-- Verify tet:utils/automatisation on pg

BEGIN;

select key, user_id, prenom, nom, email, telephone
from crm_personnes
where false;

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
       cot
from crm_collectivites
where false;

select key,
       user_id,
       user_key,
       collectivite_id,
       collectivite_key,
       niveau_acces,
       fonction,
       details_fonction,
       champ_intervention
from crm_droits
where false;

ROLLBACK;
