-- Deploy tet:stats/vues_BI to pg

BEGIN;

create or replace view stats.monthly_bucket
as
with serie as (select generate_series(0, extract(month from age(now(), date '2022-01-01'))) as m),
     month as
         (select date '2021-01-01' + interval '1 month' * serie.m as start
          from serie)
select month.start::date                                  as first_day,
       (month.start + (interval '1 month - 1 day'))::date as last_day
from month;

create materialized view stats.rattachement
as
select c.*,
       md5(pud.user_id::varchar)         as utilisateur,
       pud.created_at                    as creation,
       pud.niveau_acces                  as niveau_acces,
       pcm.fonction                      as membre_fonction,
       pcm.champ_intervention @> '{eci}' as membre_champ_intervention_eci,
       pcm.champ_intervention @> '{cae}' as membre_champ_intervention_cae
from private_utilisateur_droit pud
         join stats.collectivite c on pud.collectivite_id = c.collectivite_id
         left join private_collectivite_membre pcm
                   on pud.user_id = pcm.user_id and pud.collectivite_id = pcm.collectivite_id
where pud.collectivite_id not in (select collectivite_id from collectivite_test)
  and pud.active;

create materialized view stats.utilisateur
as
    select md5(pud.user_id::varchar) as utilisateur,
           min(pud.created_at)       as premier_rattachement
    from private_utilisateur_droit pud
             join stats.collectivite c on pud.collectivite_id = c.collectivite_id
             left join private_collectivite_membre pcm
                       on pud.user_id = pcm.user_id and pud.collectivite_id = pcm.collectivite_id
    where pud.collectivite_id not in (select collectivite_id from collectivite_test)
      and pud.active
    group by pud.user_id;

create materialized view stats.evolution_utilisateur
as
select m.first_day                                  as mois,
       (select count(*)
        from stats.utilisateur u
        where u.premier_rattachement >= m.first_day
          and u.premier_rattachement <= m.last_day) as utilisateurs,
       (select count(*)
        from stats.utilisateur u
        where u.premier_rattachement <= m.last_day) as total_utilisateurs
from stats.monthly_bucket m;

create materialized view stats.evolution_activation
as
select m.first_day                              as mois,
       (select count(*)
        from stats.collectivite_utilisateur cu
        where cu.date_activation >= m.first_day
          and cu.date_activation <= m.last_day) as activations,
       (select count(*)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_activations
from stats.monthly_bucket m;


create or replace function
    stats.refresh_views()
    returns void
as
$$
begin
    refresh materialized view stats.collectivite;
    refresh materialized view stats.collectivite_utilisateur;
    refresh materialized view stats.collectivite_referentiel;
    refresh materialized view stats.collectivite_labellisation;
    refresh materialized view stats.collectivite_plan_action;
    refresh materialized view stats.collectivite_action_statut;
    refresh materialized view stats.evolution_activation;
    refresh materialized view stats.rattachement;
    refresh materialized view stats.utilisateur;
    refresh materialized view stats.evolution_utilisateur;
end ;
$$ language plpgsql security definer;


COMMIT;
