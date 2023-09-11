-- Deploy tet:site/labellisation to pg

BEGIN;

drop materialized view stats_derniere_labellisation;
select cron.unschedule('refresh_stats_views_utilisation');

create materialized view site_labellisation
as
with dl as (select collectivite_id,
                   referentiel,
                   max(obtenue_le) as obtenue_le
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

       (select c.collectivite_id in (select collectivite_id from cot where actif)) as cot,
       dl_cae.obtenue_le is not null or
       dl_eci.obtenue_le is not null
                                                                                   as labellise,
       dl_cae.obtenue_le                                                           as cae_obtenue_le,
       dl_cae.etoiles                                                              as cae_etoiles,
       dl_cae.score_realise                                                        as cae_score_realise,
       dl_cae.score_programme                                                      as cae_score_programme,
       dl_eci.obtenue_le                                                           as eci_obtenue_le,
       dl_eci.etoiles                                                              as eci_etoiles,
       dl_eci.score_realise                                                        as eci_score_realise,
       dl_eci.score_programme                                                      as eci_score_programme

from stats.collectivite c
         left join lateral (select l.*
                            from dl
                                     join labellisation l
                                          on l.collectivite_id = dl.collectivite_id
                                              and l.referentiel = dl.referentiel
                                              and l.obtenue_le = dl.obtenue_le
                            where dl.collectivite_id = c.collectivite_id
                              and dl.referentiel = 'cae') dl_cae on true
         left join lateral (select l.*
                            from dl
                                     join labellisation l
                                          on l.collectivite_id = dl.collectivite_id
                                              and l.referentiel = dl.referentiel
                                              and l.obtenue_le = dl.obtenue_le
                            where dl.collectivite_id = c.collectivite_id
                              and dl.referentiel = 'eci') dl_eci on true;

comment on materialized view site_labellisation is
    'Les dernières info de labellisation affichées sur notre site.';

-- full text search
create index site_labellisation_nom_idx on site_labellisation
    using gin (to_tsvector('french', nom));

-- select *
-- from site_labellisation
-- where to_tsvector('french', nom) @@ to_tsquery('french', 'nantes & métro:*');

select cron.schedule('site_labellisation',
                     '0 1 * * *', -- tout les jours à 1h.
                     $$refresh materialized view site_labellisation;$$);

COMMIT;
