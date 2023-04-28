-- Deploy tet:stats/reporting to pg

BEGIN;

create materialized view stats.report_indicateur
as
with resutat_renseignes as (select indicateur_id as id, count(*) as count
                            from indicateur_resultat
                                     join stats.collectivite using (collectivite_id)
                            group by indicateur_id),
     objectif_renseignes as (select indicateur_id as id, count(*) as count
                             from indicateur_objectif
                                      join stats.collectivite using (collectivite_id)
                             group by indicateur_id),
     collectivites as (select d.id, array_agg(c.collectivite_id) as collectivite_ids
                       from stats.collectivite c
                                join indicateur_definition d on true
                                left join indicateur_resultat r
                                          on r.collectivite_id = c.collectivite_id and r.indicateur_id = d.id
                                left join indicateur_objectif o
                                          on o.collectivite_id = c.collectivite_id and o.indicateur_id = d.id
                       group by d.id)
select id,
       indicateur_group,
       identifiant,
       nom,
       r.count                           as resultats,
       o.count                           as objectifs,
       array_length(collectivite_ids, 1) as collectivites,
       collectivite_ids
from indicateur_definition i
         join resutat_renseignes r using (id)
         join objectif_renseignes o using (id)
         join collectivites c using (id);

create materialized view stats.report_indicateur_personnalise
as
select ipd.collectivite_id,
       ipd.titre,
       ipd.description,
       ipd.unite,
       ipd.commentaire,
       count(ipo) as objectifs,
       count(ipr) as resultats
from indicateur_personnalise_definition ipd
         left join indicateur_personnalise_objectif ipo on ipd.id = ipo.indicateur_id
         left join indicateur_personnalise_resultat ipr on ipd.id = ipr.indicateur_id
where ipo is not null
   or ipr is not null
group by ipd.collectivite_id, ipd.titre, ipd.description, ipd.unite, ipd.commentaire;


create or replace function
    stats.refresh_reporting()
    returns void
as
$$
begin
    refresh materialized view stats.report_scores;
    refresh materialized view stats.report_reponse_choix;
    refresh materialized view stats.report_reponse_binaire;
    refresh materialized view stats.report_reponse_proportion;
    refresh materialized view stats.report_indicateur_resultat;
    refresh materialized view stats.report_indicateur;
    refresh materialized view stats.report_indicateur_personnalise;
end;
$$ language plpgsql;

COMMIT;
