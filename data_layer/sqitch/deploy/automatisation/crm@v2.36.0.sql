-- Deploy tet:utils/automatisation to pg

BEGIN;

create view crm_personnes
as
select p.prenom || ' ' || p.nom as key,
       p.user_id,
       p.prenom,
       p.nom,
       p.email,
       p.telephone
from utilisateur.dcp_display p
where not limited
  and not deleted
  and is_service_role();

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

create view crm_droits
as
select d.collectivite_id || ' ' || d.user_id      as key,
       d.user_id                                  as user_id,
       p.prenom || ' ' || p.nom                   as user_key,
       d.collectivite_id                          as collectivite_id,
       c.nom || ' (' || c.collectivite_id || ')'  as collectivite_key,
       d.niveau_acces,
       m.fonction,
       m.details_fonction,
       array_to_string(m.champ_intervention, ',') as champ_intervention
from private_utilisateur_droit d
         join stats.collectivite c on d.collectivite_id = c.collectivite_id
         join dcp p on p.user_id = d.user_id
         left join private_collectivite_membre m
                   on m.user_id = d.user_id and m.collectivite_id = d.collectivite_id
where active
  and is_service_role()
order by collectivite_id;

COMMIT;
