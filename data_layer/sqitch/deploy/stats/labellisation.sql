-- Deploy tet:stats/labellisation to pg

BEGIN;

create materialized view stats_derniere_labellisation
as
with labellise as (select collectivite_id,
                          referentiel
                   from labellisation l
                   group by collectivite_id, referentiel)
select c.collectivite_id,
       c.nom,
       c.type_collectivite,
       c.nature_collectivite,
       c.code_siren_insee,
       c.region_name,
       c.region_code,
       c.departement_name,
       c.departement_code,
       c.population_totale,
       c.departement_iso_3166,
       c.region_iso_3166,
       ll.referentiel,
       ll.etoiles,
       ll.score_programme,
       ll.score_realise,
       ll.annee
from labellise l
         join stats.collectivite c using (collectivite_id)
         left join lateral (select l2.referentiel,
                                   l2.etoiles,
                                   l2.score_programme,
                                   l2.score_realise,
                                   l2.annee
                            from labellisation l2
                            where l.collectivite_id = l2.collectivite_id
                              and l.referentiel = l2.referentiel
                            order by annee desc
                            limit 1) as ll on true;

COMMIT;
