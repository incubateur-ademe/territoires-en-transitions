-- Deploy tet:collectivites to pg
-- requires: base
-- requires: imports

BEGIN;

create or replace view named_collectivite as
select * from (SELECT collectivite.id                                        AS collectivite_id,
                      COALESCE(epci.nom, commune.nom, collectivite_test.nom) AS nom,
                      case
                          when epci is not null then 'epci'
                          when commune is not null then 'commune'
                          when collectivite_test is not null then 'collectivite_test'
                          end as type
               FROM collectivite
                        LEFT JOIN epci ON epci.collectivite_id = collectivite.id
                        LEFT JOIN commune ON commune.collectivite_id = collectivite.id
                        LEFT JOIN collectivite_test ON collectivite_test.collectivite_id = collectivite.id
               ORDER BY (
                            CASE
                                WHEN collectivite_test.nom IS NOT NULL
                                    THEN '0'::text || unaccent(collectivite_test.nom::text)
                                ELSE unaccent(COALESCE(epci.nom, commune.nom)::text)
                                END)) col where type = 'epci';
COMMIT;
