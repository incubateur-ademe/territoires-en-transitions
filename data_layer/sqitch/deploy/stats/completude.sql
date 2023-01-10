-- Deploy tet:stats/completude to pg
-- requires: referentiel/contenu

BEGIN;

drop materialized view stats_tranche_completude;
create materialized view stats_tranche_completude
as
with bounds as (select unnest('{0, 20, 50, 80,  100}'::numeric[]) as bound),
     ranges as (select numrange(lower.bound, upper.bound) as range,
                       lower.bound                        as lower_bound,
                       upper.bound                        as upper_bound
                from bounds lower
                         left join lateral (select * from bounds b where b.bound > lower.bound limit 1) upper on true),
     completude as (select coalesce(completude_eci, .0) as completude_eci,
                           coalesce(completude_cae, .0) as completude_cae
                    from stats.pourcentage_completude)
select lower_bound,
       upper_bound,
       eci,
       cae,
       -- compatibilité avec la version pre 1.20.0
       lower_bound::int || ':' || coalesce(upper_bound::int, 100 ) as bucket
from ranges r
         left join lateral (select count(*) filter ( where r.range @> c.completude_eci::numeric ) as eci,
                                   count(*) filter ( where r.range @> c.completude_cae::numeric ) as cae
                            from completude c) in_range on true
;

COMMIT;
