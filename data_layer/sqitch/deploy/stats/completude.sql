-- Deploy tet:stats/completude to pg
-- requires: referentiel/contenu

BEGIN;

create view stats_tranche_completude
as
with completude as (
    select coalesce(completude_eci, .0) as completude_eci,
           coalesce(completude_cae, .0) as completude_cae
    from retool_completude
),
     range as (
         select unnest('{0,       0.00001, 50, 80,  100}'::float[])         as start,
                unnest('{0.00001, 50,      80, 100, 100.1}'::float[]) as "end"
     ),
     eci as (
         select r.start, count(eci.*) as count
         from range r
                  left join completude eci on eci.completude_eci >= start and eci.completude_eci < "end"
         group by r.start
     ),
     cae as (
         select r.start, count(cae.*) as count
         from range r
                  left join completude cae on cae.completude_cae >= start and cae.completude_cae < "end"
         group by r.start
     )
select range.start::int || ':' || range."end"::int as bucket, eci.count as eci, cae.count as cae
from range
         left join eci on eci.start = range.start
         left join cae on cae.start = range.start
order by range.start;

COMMIT;
