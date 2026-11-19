-- Revert tet:stats/drop_vues_stats_inutilisees from pg

BEGIN;

-- Définitions reprises de la base avant suppression (pg_dump). Les vues sont
-- recréées vides (WITH NO DATA) : le premier passage des crons les remplit.
CREATE MATERIALIZED VIEW private.retool_plan_action_premier_usage AS
 WITH first AS (
         WITH fiche_axe AS (
                 WITH min_fiche AS (
                         WITH min_fiche AS (
                                 SELECT fiche_action.collectivite_id,
                                    min(fiche_action.created_at) AS created_at
                                   FROM public.fiche_action
                                  GROUP BY fiche_action.collectivite_id
                                )
                         SELECT fa_1.collectivite_id,
                            min(fa_1.id) AS id
                           FROM (public.fiche_action fa_1
                             JOIN min_fiche mf ON (((mf.collectivite_id = fa_1.collectivite_id) AND (mf.created_at = fa_1.created_at))))
                          GROUP BY fa_1.collectivite_id
                        ), min_axe AS (
                         WITH min_axe AS (
                                 SELECT axe.collectivite_id,
                                    min(axe.created_at) AS created_at
                                   FROM public.axe
                                  GROUP BY axe.collectivite_id
                                )
                         SELECT a.collectivite_id,
                            min(a.id) AS id
                           FROM (public.axe a
                             JOIN min_axe ma ON (((ma.collectivite_id = a.collectivite_id) AND (ma.created_at = a.created_at))))
                          GROUP BY a.collectivite_id
                        )
                 SELECT fa_1.collectivite_id,
                    fa_1.created_at,
                    fa_1.modified_by,
                    true AS fiche
                   FROM (public.fiche_action fa_1
                     JOIN min_fiche USING (id))
                UNION
                 SELECT a.collectivite_id,
                    a.created_at,
                    a.modified_by,
                    false AS fiche
                   FROM (public.axe a
                     JOIN min_axe USING (id))
                ), min_fiche_axe AS (
                 SELECT fiche_axe.collectivite_id,
                    min(fiche_axe.created_at) AS created_at
                   FROM fiche_axe
                  GROUP BY fiche_axe.collectivite_id
                )
         SELECT fa.collectivite_id,
            fa.created_at,
            fa.fiche,
            dcp.email
           FROM ((fiche_axe fa
             JOIN min_fiche_axe mfa ON (((fa.collectivite_id = mfa.collectivite_id) AND (fa.created_at = mfa.created_at))))
             LEFT JOIN public.dcp ON ((fa.modified_by = dcp.user_id)))
          ORDER BY fa.fiche
        )
 SELECT nc.collectivite_id,
    nc.nom,
    f.fiche,
    f.created_at,
    f.email
   FROM (stats.collectivite nc
     JOIN LATERAL ( SELECT f_1.collectivite_id,
            f_1.created_at,
            f_1.fiche,
            f_1.email
           FROM first f_1
          WHERE (f_1.collectivite_id = nc.collectivite_id)
         LIMIT 1) f ON (true))
  ORDER BY f.created_at DESC
  WITH NO DATA;
COMMENT ON MATERIALIZED VIEW private.retool_plan_action_premier_usage IS 'Vue pour identifier la toute première utilisation de la fonctionnalité plan action
    par les collectivités.';
CREATE VIEW public.retool_plan_action_premier_usage AS
 SELECT retool_plan_action_premier_usage.collectivite_id,
    retool_plan_action_premier_usage.nom,
    retool_plan_action_premier_usage.fiche,
    retool_plan_action_premier_usage.created_at,
    retool_plan_action_premier_usage.email
   FROM private.retool_plan_action_premier_usage
  WHERE public.is_service_role();
CREATE MATERIALIZED VIEW stats.evolution_nombre_fiches AS
 SELECT mb.first_day AS mois,
    count(*) FILTER (WHERE (fa.created_at <= mb.last_day)) AS fiches
   FROM ((stats.monthly_bucket mb
     JOIN stats.collectivite_active ca ON (true))
     JOIN public.fiche_action fa USING (collectivite_id))
  GROUP BY mb.first_day
  ORDER BY mb.first_day
  WITH NO DATA;
CREATE VIEW public.stats_evolution_nombre_fiches AS
 SELECT evolution_nombre_fiches.mois,
    evolution_nombre_fiches.fiches
   FROM stats.evolution_nombre_fiches;
CREATE MATERIALIZED VIEW stats.locales_collectivite_actives_et_total_par_type AS
 WITH collectivite_typologie AS (
         SELECT c.collectivite_id,
            c.region_code,
            c.departement_code,
                CASE
                    WHEN (t.type = 'EPCI à fiscalité propre'::text) THEN 'EPCI'::text
                    WHEN (c.type_collectivite = 'syndicat'::text) THEN 'syndicat'::text
                    WHEN (c.type_collectivite = 'commune'::text) THEN 'commune'::text
                    ELSE NULL::text
                END AS typologie
           FROM (stats.collectivite c
             LEFT JOIN public.collectivite_banatic_type t ON ((c.nature_collectivite = t.id)))
        )
 SELECT collectivite_typologie.typologie,
    NULL::character varying(2) AS code_region,
    NULL::character varying(2) AS code_departement,
    count(*) AS total,
    count(*) FILTER (WHERE (collectivite_typologie.collectivite_id IN ( SELECT collectivite_active.collectivite_id
           FROM stats.collectivite_active))) AS actives
   FROM collectivite_typologie
  GROUP BY collectivite_typologie.typologie
UNION ALL
 SELECT collectivite_typologie.typologie,
    collectivite_typologie.region_code AS code_region,
    NULL::character varying AS code_departement,
    count(*) AS total,
    count(*) FILTER (WHERE (collectivite_typologie.collectivite_id IN ( SELECT collectivite_active.collectivite_id
           FROM stats.collectivite_active))) AS actives
   FROM collectivite_typologie
  GROUP BY collectivite_typologie.typologie, collectivite_typologie.region_code
UNION ALL
 SELECT collectivite_typologie.typologie,
    NULL::character varying AS code_region,
    collectivite_typologie.departement_code AS code_departement,
    count(*) AS total,
    count(*) FILTER (WHERE (collectivite_typologie.collectivite_id IN ( SELECT collectivite_active.collectivite_id
           FROM stats.collectivite_active))) AS actives
   FROM collectivite_typologie
  GROUP BY collectivite_typologie.typologie, collectivite_typologie.departement_code
  WITH NO DATA;
CREATE VIEW public.stats_locales_collectivite_actives_et_total_par_type AS
 SELECT locales_collectivite_actives_et_total_par_type.typologie,
    locales_collectivite_actives_et_total_par_type.code_region,
    locales_collectivite_actives_et_total_par_type.code_departement,
    locales_collectivite_actives_et_total_par_type.total,
    locales_collectivite_actives_et_total_par_type.actives
   FROM stats.locales_collectivite_actives_et_total_par_type;
CREATE MATERIALIZED VIEW stats.locales_evolution_collectivite_avec_minimum_fiches AS
 WITH fiche_collectivite AS (
         SELECT mb.first_day AS mois,
            c.collectivite_id,
            c.region_code,
            c.departement_code,
            COALESCE(count(*) FILTER (WHERE (fa.created_at <= mb.last_day)), (0)::bigint) AS fiches
           FROM ((stats.monthly_bucket mb
             JOIN stats.collectivite c ON (true))
             LEFT JOIN public.fiche_action fa USING (collectivite_id))
          GROUP BY mb.first_day, c.collectivite_id, c.departement_code, c.region_code
        )
 SELECT fiche_collectivite.mois,
    NULL::character varying(2) AS code_region,
    NULL::character varying(2) AS code_departement,
    count(*) FILTER (WHERE (fiche_collectivite.fiches > 5)) AS collectivites
   FROM fiche_collectivite
  GROUP BY fiche_collectivite.mois
UNION ALL
 SELECT fiche_collectivite.mois,
    fiche_collectivite.region_code AS code_region,
    NULL::character varying AS code_departement,
    count(*) FILTER (WHERE (fiche_collectivite.fiches > 5)) AS collectivites
   FROM fiche_collectivite
  GROUP BY fiche_collectivite.mois, fiche_collectivite.region_code
UNION ALL
 SELECT fiche_collectivite.mois,
    NULL::character varying AS code_region,
    fiche_collectivite.departement_code AS code_departement,
    count(*) FILTER (WHERE (fiche_collectivite.fiches > 5)) AS collectivites
   FROM fiche_collectivite
  GROUP BY fiche_collectivite.mois, fiche_collectivite.departement_code
  ORDER BY 1
  WITH NO DATA;
CREATE VIEW public.stats_locales_evolution_collectivite_avec_minimum_fiches AS
 SELECT locales_evolution_collectivite_avec_minimum_fiches.mois,
    locales_evolution_collectivite_avec_minimum_fiches.code_region,
    locales_evolution_collectivite_avec_minimum_fiches.code_departement,
    locales_evolution_collectivite_avec_minimum_fiches.collectivites
   FROM stats.locales_evolution_collectivite_avec_minimum_fiches;
CREATE MATERIALIZED VIEW stats.locales_evolution_indicateur_referentiel AS
 WITH indicateurs AS (
         SELECT iv.collectivite_id,
            sc.region_code,
            sc.departement_code,
            iv.indicateur_id,
            min(iv.modified_at) AS first_modified_at
           FROM ((public.indicateur_valeur iv
             JOIN stats.collectivite sc ON ((iv.collectivite_id = sc.collectivite_id)))
             JOIN public.indicateur_definition id ON ((iv.indicateur_id = id.id)))
          WHERE ((iv.resultat IS NOT NULL) AND (id.collectivite_id IS NULL))
          GROUP BY iv.collectivite_id, sc.region_code, sc.departement_code, iv.indicateur_id
        )
 SELECT m.first_day AS mois,
    NULL::character varying(2) AS code_region,
    NULL::character varying(2) AS code_departement,
    count(i.*) AS indicateurs
   FROM (stats.monthly_bucket m
     LEFT JOIN indicateurs i ON ((i.first_modified_at <= m.last_day)))
  GROUP BY m.first_day
UNION ALL
 SELECT m.first_day AS mois,
    r.code AS code_region,
    NULL::character varying AS code_departement,
    count(i.*) AS indicateurs
   FROM ((imports.region r
     JOIN stats.monthly_bucket m ON (true))
     LEFT JOIN indicateurs i ON (((i.first_modified_at <= m.last_day) AND ((i.region_code)::text = (r.code)::text))))
  GROUP BY m.first_day, r.code
UNION ALL
 SELECT m.first_day AS mois,
    NULL::character varying AS code_region,
    d.code AS code_departement,
    count(i.*) AS indicateurs
   FROM ((imports.departement d
     JOIN stats.monthly_bucket m ON (true))
     LEFT JOIN indicateurs i ON (((i.first_modified_at <= m.last_day) AND ((i.departement_code)::text = (d.code)::text))))
  GROUP BY m.first_day, d.code
  WITH NO DATA;
CREATE VIEW public.stats_locales_evolution_indicateur_referentiel AS
 SELECT locales_evolution_indicateur_referentiel.mois,
    locales_evolution_indicateur_referentiel.code_region,
    locales_evolution_indicateur_referentiel.code_departement,
    locales_evolution_indicateur_referentiel.indicateurs
   FROM stats.locales_evolution_indicateur_referentiel;
CREATE MATERIALIZED VIEW stats.locales_evolution_nombre_fiches AS
 SELECT mb.first_day AS mois,
    NULL::character varying(2) AS code_region,
    NULL::character varying(2) AS code_departement,
    count(*) FILTER (WHERE (fa.created_at <= mb.last_day)) AS fiches
   FROM ((stats.monthly_bucket mb
     JOIN stats.collectivite ca ON (true))
     JOIN public.fiche_action fa USING (collectivite_id))
  GROUP BY mb.first_day
UNION ALL
 SELECT mb.first_day AS mois,
    ca.region_code AS code_region,
    NULL::character varying AS code_departement,
    count(*) FILTER (WHERE (fa.created_at <= mb.last_day)) AS fiches
   FROM ((stats.monthly_bucket mb
     JOIN stats.collectivite ca ON (true))
     LEFT JOIN public.fiche_action fa USING (collectivite_id))
  GROUP BY mb.first_day, ca.region_code
UNION ALL
 SELECT mb.first_day AS mois,
    NULL::character varying AS code_region,
    ca.departement_code AS code_departement,
    count(*) FILTER (WHERE (fa.created_at <= mb.last_day)) AS fiches
   FROM ((stats.monthly_bucket mb
     JOIN stats.collectivite ca ON (true))
     LEFT JOIN public.fiche_action fa USING (collectivite_id))
  GROUP BY mb.first_day, ca.departement_code
  ORDER BY 1
  WITH NO DATA;
CREATE VIEW public.stats_locales_evolution_nombre_fiches AS
 SELECT locales_evolution_nombre_fiches.mois,
    locales_evolution_nombre_fiches.code_region,
    locales_evolution_nombre_fiches.code_departement,
    locales_evolution_nombre_fiches.fiches
   FROM stats.locales_evolution_nombre_fiches;
CREATE MATERIALIZED VIEW public.stats_rattachements AS
 WITH daily AS (
         SELECT (d.created_at)::date AS day,
            count(d.created_at) AS count
           FROM (public.private_utilisateur_droit d
             JOIN stats.collectivite_active c ON ((d.collectivite_id = c.collectivite_id)))
          WHERE d.active
          GROUP BY ((d.created_at)::date)
        )
 SELECT daily.day AS date,
    daily.count,
    (sum(daily.count) OVER (ORDER BY daily.day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW))::integer AS cumulated_count
   FROM daily
  WITH NO DATA;
COMMENT ON MATERIALIZED VIEW public.stats_rattachements IS 'L''évolution des rattachements des utilisateurs aux collectivités, soit l''évolution de la création des droits.';
CREATE MATERIALIZED VIEW public.stats_unique_active_collectivite AS
 WITH unique_collectivite_droit AS (
         SELECT d.collectivite_id,
            min(d.created_at) AS created_at
           FROM (public.private_utilisateur_droit d
             JOIN stats.collectivite_active c ON ((d.collectivite_id = c.collectivite_id)))
          GROUP BY d.collectivite_id
        ), daily AS (
         SELECT (d.created_at)::date AS day,
            count(d.created_at) AS count
           FROM unique_collectivite_droit d
          GROUP BY ((d.created_at)::date)
        )
 SELECT daily.day AS date,
    daily.count,
    (sum(daily.count) OVER (ORDER BY daily.day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW))::integer AS cumulated_count
   FROM daily
  WITH NO DATA;
COMMENT ON MATERIALIZED VIEW public.stats_unique_active_collectivite IS 'L''évolution des activations des collectivités, soit l''évolution des rattachements initiaux.';
CREATE MATERIALIZED VIEW public.stats_unique_active_users AS
 WITH unique_user_droit AS (
         SELECT d.user_id,
            min(d.created_at) AS created_at
           FROM (public.private_utilisateur_droit d
             JOIN stats.collectivite_active c ON ((d.collectivite_id = c.collectivite_id)))
          WHERE d.active
          GROUP BY d.user_id
        ), daily AS (
         SELECT (d.created_at)::date AS day,
            count(d.created_at) AS count
           FROM unique_user_droit d
          GROUP BY ((d.created_at)::date)
        )
 SELECT daily.day AS date,
    daily.count,
    (sum(daily.count) OVER (ORDER BY daily.day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW))::integer AS cumulated_count
   FROM daily
  WITH NO DATA;
GRANT ALL ON TABLE public.retool_plan_action_premier_usage TO anon;
GRANT ALL ON TABLE public.retool_plan_action_premier_usage TO authenticated;
GRANT ALL ON TABLE public.retool_plan_action_premier_usage TO service_role;
GRANT ALL ON TABLE public.stats_evolution_nombre_fiches TO anon;
GRANT ALL ON TABLE public.stats_evolution_nombre_fiches TO authenticated;
GRANT ALL ON TABLE public.stats_evolution_nombre_fiches TO service_role;
GRANT ALL ON TABLE public.stats_locales_collectivite_actives_et_total_par_type TO anon;
GRANT ALL ON TABLE public.stats_locales_collectivite_actives_et_total_par_type TO authenticated;
GRANT ALL ON TABLE public.stats_locales_collectivite_actives_et_total_par_type TO service_role;
GRANT ALL ON TABLE public.stats_locales_evolution_collectivite_avec_minimum_fiches TO anon;
GRANT ALL ON TABLE public.stats_locales_evolution_collectivite_avec_minimum_fiches TO authenticated;
GRANT ALL ON TABLE public.stats_locales_evolution_collectivite_avec_minimum_fiches TO service_role;
GRANT ALL ON TABLE public.stats_locales_evolution_indicateur_referentiel TO anon;
GRANT ALL ON TABLE public.stats_locales_evolution_indicateur_referentiel TO authenticated;
GRANT ALL ON TABLE public.stats_locales_evolution_indicateur_referentiel TO service_role;
GRANT ALL ON TABLE public.stats_locales_evolution_nombre_fiches TO anon;
GRANT ALL ON TABLE public.stats_locales_evolution_nombre_fiches TO authenticated;
GRANT ALL ON TABLE public.stats_locales_evolution_nombre_fiches TO service_role;
GRANT ALL ON TABLE public.stats_rattachements TO anon;
GRANT ALL ON TABLE public.stats_rattachements TO authenticated;
GRANT ALL ON TABLE public.stats_rattachements TO service_role;
GRANT ALL ON TABLE public.stats_unique_active_collectivite TO anon;
GRANT ALL ON TABLE public.stats_unique_active_collectivite TO authenticated;
GRANT ALL ON TABLE public.stats_unique_active_collectivite TO service_role;
GRANT ALL ON TABLE public.stats_unique_active_users TO anon;
GRANT ALL ON TABLE public.stats_unique_active_users TO authenticated;
GRANT ALL ON TABLE public.stats_unique_active_users TO service_role;

CREATE FUNCTION stats.refresh_stats_locales() RETURNS void
  LANGUAGE plpgsql
AS
$$
BEGIN
  refresh materialized view stats.locales_collectivite_actives_et_total_par_type;
  refresh materialized view stats.evolution_nombre_fiches;
  refresh materialized view stats.locales_evolution_collectivite_avec_minimum_fiches;
  refresh materialized view stats.locales_evolution_nombre_fiches;
END
$$;

CREATE FUNCTION stats.refresh_stats_locales_indicateurs() RETURNS void
  LANGUAGE plpgsql
AS
$$
BEGIN
  refresh materialized view stats.locales_evolution_indicateur_referentiel;
END
$$;

do $$
begin
  if to_regclass('cron.job') is not null then
    perform cron.schedule('refresh_stats_collectivite', '0 0 * * *',
      'refresh materialized view stats_unique_active_collectivite; refresh materialized view stats_rattachements;');
    perform cron.schedule('refresh_stats_utilisateur', '0 0 * * *',
      'refresh materialized view stats_unique_active_users');
    perform cron.schedule('refresh_stats_views_locales', '0 2 * * *',
      'select stats.refresh_stats_locales();');
    perform cron.schedule('refresh_stats_views_locales_indicateur', '15 2 * * *',
      'select stats.refresh_stats_locales_indicateurs();');
    perform cron.schedule('refresh_retool_plan_action_premier_usage', '0 0 * * *',
      'refresh materialized view private.retool_plan_action_premier_usage');
  end if;
end $$;

COMMIT;
