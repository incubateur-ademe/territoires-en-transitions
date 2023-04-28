-- Deploy tet:stats/vues_BI to pg

BEGIN;

drop view stats_engagement_collectivite;
drop materialized view stats.engagement_collectivite;

create materialized view stats.engagement_collectivite
as
select collectivite_id,
       coalesce(cot.actif, false) as cot,
       coalesce(eci.etoiles, 0)   as etoiles_eci,
       coalesce(cae.etoiles, 0)   as etoiles_cae
from stats.collectivite c
         left join cot using (collectivite_id)
         left join lateral (select etoiles
                            from labellisation l
                            where l.collectivite_id = c.collectivite_id
                              and referentiel = 'eci'
                            order by l.obtenue_le desc
                            limit 1) eci on true
         left join lateral (select etoiles
                            from labellisation l
                            where l.collectivite_id = c.collectivite_id
                              and referentiel = 'cae'
                            order by l.obtenue_le desc
                            limit 1) cae on true;

COMMIT;
