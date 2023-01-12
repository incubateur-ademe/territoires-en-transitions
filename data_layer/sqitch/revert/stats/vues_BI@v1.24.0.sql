-- Deploy tet:stats/vues_BI to pg

BEGIN;

drop view stats_evolution_nombre_utilisateur_par_collectivite;
drop materialized view stats.evolution_nombre_utilisateur_par_collectivite;

create materialized view stats.evolution_nombre_utilisateur_par_collectivite
as
with membres as (select collectivite_id,
                        mb.first_day                                                                  as mois,
                        count(*)
                        filter ( where active and pud.created_at <= mb.last_day and pcm is not null ) as nombre
                 from stats.monthly_bucket mb
                          cross join stats.collectivite_active
                          left join private_utilisateur_droit pud using (collectivite_id)
                          left join private_collectivite_membre pcm using (collectivite_id, user_id)
                 group by collectivite_id,
                          mb.first_day)
select mois,
       avg(nombre)                                           as moyen,
       max(nombre)                                           as maximum,
       percentile_cont(0.5) within group ( order by nombre ) as median
from membres
group by mois
order by mois;

create view stats_evolution_nombre_utilisateur_par_collectivite
as
select *
from stats.evolution_nombre_utilisateur_par_collectivite;

COMMIT;
