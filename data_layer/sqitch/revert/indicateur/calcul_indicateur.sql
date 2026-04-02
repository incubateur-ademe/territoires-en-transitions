-- Revert tet:indicateur/calcul_indicateur from pg
--
-- stats.locales_evolution_collectivite_avec_indicateur_referentiel uses SELECT iv.*
-- from indicateur_valeur; after a revert of stats/drop-old-stats-views that pins
-- calcul_auto / calcul_auto_identifiants_manquants. Drop and recreate here so the
-- columns can be removed (definitions aligned with revert/stats/drop-old-stats-views.sql).

BEGIN;

DROP VIEW IF EXISTS public.stats_locales_evolution_collectivite_avec_indicateur;
DROP MATERIALIZED VIEW IF EXISTS stats.locales_evolution_collectivite_avec_indicateur_referentiel;

alter table indicateur_valeur
  drop column calcul_auto,
  drop column calcul_auto_identifiants_manquants;

CREATE MATERIALIZED VIEW stats.locales_evolution_collectivite_avec_indicateur_referentiel AS
WITH indicateur_collectivite AS (
                                SELECT mb.first_day                                                               AS mois,
                                       c.collectivite_id,
                                       c.region_code,
                                       c.departement_code,
                                       count(ir.*)                                                   AS resultats
                                FROM stats.monthly_bucket mb
                                JOIN stats.collectivite c ON true
                                LEFT JOIN (
                                          SELECT iv.*
                                          FROM indicateur_valeur iv
                                          JOIN indicateur_definition id ON iv.indicateur_id = id.id
                                          where iv.resultat is not null and id.collectivite_id is null
                                          ) ir on ir.collectivite_id = c.collectivite_id and ir.modified_at <= mb.first_day
                                GROUP BY mb.first_day, c.collectivite_id, c.region_code, c.departement_code
                                )
SELECT indicateur_collectivite.mois,
       NULL::character varying(2)                                    AS code_region,
       NULL::character varying(2)                                    AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois
UNION ALL
SELECT indicateur_collectivite.mois,
       indicateur_collectivite.region_code                           AS code_region,
       NULL::character varying                                       AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois, indicateur_collectivite.region_code
UNION ALL
SELECT indicateur_collectivite.mois,
       NULL::character varying                                       AS code_region,
       indicateur_collectivite.departement_code                      AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois, indicateur_collectivite.departement_code
ORDER BY 1;

CREATE OR REPLACE VIEW public.stats_locales_evolution_collectivite_avec_indicateur AS
SELECT mois,
       code_region,
       code_departement,
       collectivites
FROM stats.locales_evolution_collectivite_avec_indicateur_referentiel;

COMMIT;
