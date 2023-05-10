-- Deploy tet:stats/reporting to pg

BEGIN;

drop materialized view stats.report_indicateur;

create materialized view stats.report_indicateur
as
with resutat_renseignes as (select indicateur_id as id,
                                   count(*)      as count
                            from indicateur_resultat
                                     join stats.collectivite using (collectivite_id)
                            group by indicateur_id),
     objectif_renseignes as (select indicateur_id as id,
                                    count(*)      as count
                             from indicateur_objectif
                                      join stats.collectivite using (collectivite_id)
                             group by indicateur_id),
     collectivites as (select d.id,
                              array_agg(distinct c.collectivite_id) as ids,
                              count(distinct c.collectivite_id)     as count
                       from stats.collectivite c
                                join indicateur_definition d on true
                                left join indicateur_resultat r
                                          on r.collectivite_id = c.collectivite_id and r.indicateur_id = d.id
                                left join indicateur_objectif o
                                          on o.collectivite_id = c.collectivite_id and o.indicateur_id = d.id
                       where r is not null
                       group by d.id)
select id,
       indicateur_group,
       identifiant,
       nom,
       r.count as resultats,
       o.count as objectifs,
       c.count as collectivites,
       c.ids   as collectivite_ids
from indicateur_definition i
         join resutat_renseignes r using (id)
         join objectif_renseignes o using (id)
         join collectivites c using (id);

COMMIT;
