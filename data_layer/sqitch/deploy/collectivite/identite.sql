-- Deploy tet:collectivite/identite to pg
-- requires: collectivite/collectivite
-- requires: collectivite/type

BEGIN;

create or replace view collectivite_identite(id, population, type, localisation) as
WITH meta_commune AS (SELECT com.collectivite_id,
                             private.population_buckets(ic.population) AS population,
                             CASE
                                 WHEN ir.drom THEN '{"DOM"}'::text
                                 ELSE '{"Metropole"}'::text
                                 END                                   AS localisation
                      FROM commune com
                               LEFT JOIN imports.commune ic ON ic.code::text = com.code::text
                               LEFT JOIN imports.region ir ON ic.region_code::text = ir.code::text),
     meta_epci AS (SELECT epci.collectivite_id,
                          private.population_buckets(ib.population) AS population,
                          CASE
                              WHEN ir.drom THEN '{"DOM"}'::text
                              ELSE '{"Metropole"}'::text
                              END                                   AS localisation
                   FROM epci
                            LEFT JOIN imports.banatic ib ON ib.siren::text = epci.siren::text
                            LEFT JOIN imports.region ir ON ib.region_code::text = ir.code::text)
SELECT c.id,
       COALESCE(mc.population, me.population, '{}'::text[])                 AS population,
       COALESCE(private.collectivite_type(c.id), '{}'::type_collectivite[]) AS type,
       COALESCE(mc.localisation, me.localisation, '{}'::text)::text[]       AS localisation
FROM collectivite c
         LEFT JOIN meta_commune mc ON mc.collectivite_id = c.id
         LEFT JOIN meta_epci me ON me.collectivite_id = c.id;

COMMIT;
