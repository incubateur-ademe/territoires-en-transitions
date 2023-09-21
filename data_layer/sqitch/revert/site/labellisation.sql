-- Revert tet:site/labellisation from pg

BEGIN;

drop materialized view site_labellisation;

create materialized view stats_derniere_labellisation as
WITH labellise AS (SELECT l_1.collectivite_id,
                          l_1.referentiel
                   FROM labellisation l_1
                   GROUP BY l_1.collectivite_id, l_1.referentiel)
SELECT c.collectivite_id,
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
FROM labellise l
         JOIN stats.collectivite c USING (collectivite_id)
         LEFT JOIN LATERAL ( SELECT l2.referentiel,
                                    l2.etoiles,
                                    l2.score_programme,
                                    l2.score_realise,
                                    l2.annee
                             FROM labellisation l2
                             WHERE l.collectivite_id = l2.collectivite_id
                               AND l.referentiel = l2.referentiel
                             ORDER BY l2.annee DESC
                             LIMIT 1) ll ON true;

select cron.schedule('refresh_stats_views_utilisation',
                     '0 1 * * *', -- tout les jours à 1h.
                     $$refresh materialized view stats_derniere_labellisation;$$);

COMMIT;
