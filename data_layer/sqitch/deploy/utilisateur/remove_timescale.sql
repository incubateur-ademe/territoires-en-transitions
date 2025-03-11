-- Deploy tet:utilisateur/remove_timescale to pg

BEGIN;

drop materialized view if exists stats.evolution_usage_fonction;

drop materialized view if exists stats.evolution_visite;

drop materialized view if exists stats.evolution_utilisateur_unique_quotidien;

drop materialized view if exists stats.evolution_utilisateur_unique_mensuel;

drop view if exists public.crm_usages;

drop materialized view if exists stats.crm_usages;

drop function if exists stats.amplitude_visite;

drop function if exists posthog.event(tstzrange);

drop function if exists posthog.event(visite);

CREATE TABLE IF NOT EXISTS public.visite_backup (
	"time" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	page public.visite_page NOT NULL,
	tag public.visite_tag NULL,
	onglet public.visite_onglet NULL,
	user_id uuid NULL,
	collectivite_id int4 NULL
);

INSERT INTO visite_backup
SELECT * FROM visite;

drop table if exists  visite;

drop function if exists posthog.event(usage);

CREATE TABLE IF NOT EXISTS public.usage_backup (
	"time" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	fonction public."usage_fonction" NOT NULL,
	"action" public."usage_action" NOT NULL,
	page public."visite_page" NULL,
	user_id uuid NULL,
	collectivite_id int4 NULL
);

INSERT INTO usage_backup
SELECT * FROM usage;

drop table if exists  usage;

drop extension if exists timescaledb;

CREATE TABLE public.visite AS
SELECT * FROM public.visite_backup;
CREATE INDEX IF NOT EXISTS idx_page_visite_time ON public.visite USING btree (page, "time" DESC);
CREATE INDEX IF NOT EXISTS idx_visite_time ON public.visite USING btree ("time" DESC);

CREATE TABLE public.usage AS
SELECT * FROM public.usage_backup;
CREATE INDEX IF NOT EXISTS idx_usage_fonction_time ON public.usage USING btree (fonction, "time" DESC);
CREATE INDEX IF NOT EXISTS idx_usage_time ON public.usage USING btree ("time" DESC);


-- Recreate all materialized views
create materialized view if not exists stats.evolution_usage_fonction
as
select date_trunc('day', time, 'Europe/Paris') as jour,
       fonction,
       action,
       page,
       count(*)                   as occurences
from usage
group by jour, fonction, action, page
order by jour;

create materialized view if not exists stats.evolution_visite
as
select date_trunc('day', time, 'Europe/Paris') as jour,
       page,
       tag,
       onglet,
       count(*)                   as occurences
from visite
group by jour, page, tag, onglet
order by jour;

create materialized view if not exists stats.evolution_utilisateur_unique_quotidien
as
with daily_users as (select date_trunc('day', time, 'Europe/Paris') as jour,
                            user_id
                     from visite
                     group by jour, user_id
                     order by jour)
select jour,
       count(*) as utilisateurs
from daily_users
group by jour;

create materialized view if not exists stats.evolution_utilisateur_unique_mensuel
as
with daily_users as (select date_trunc('month', time, 'Europe/Paris') as mois,
                            user_id
                     from visite
                     group by mois, user_id
                     order by mois)
select mois,
       count(*) as utilisateurs
from daily_users
group by mois;

CREATE MATERIALIZED VIEW if not exists stats.crm_usages
TABLESPACE pg_default
AS WITH premier_rattachements AS (
         SELECT private_utilisateur_droit.collectivite_id,
            min(private_utilisateur_droit.created_at)::date AS date
           FROM private_utilisateur_droit
          WHERE private_utilisateur_droit.active
          GROUP BY private_utilisateur_droit.collectivite_id
        ), comptes AS (
         SELECT c_1.collectivite_id,
            ( SELECT count(*) AS count
                   FROM fiche_action x_1
                  WHERE x_1.collectivite_id = c_1.collectivite_id) AS fiches,
            ( SELECT count(*) AS count
                   FROM axe x_1
                  WHERE x_1.collectivite_id = c_1.collectivite_id AND x_1.parent IS NULL) AS plans,
            ( SELECT count(*) AS count
                   FROM indicateur_valeur x_1
                     JOIN indicateur_definition id ON x_1.indicateur_id = id.id
                  WHERE x_1.collectivite_id = c_1.collectivite_id AND x_1.resultat IS NOT NULL AND id.collectivite_id IS NULL) AS resultats_indicateurs,
            ( SELECT count(*) AS count
                   FROM indicateur_definition x_1
                  WHERE x_1.collectivite_id IS NOT NULL AND x_1.collectivite_id = c_1.collectivite_id) AS indicateurs_perso,
            ( SELECT count(*) AS count
                   FROM indicateur_valeur x_1
                     JOIN indicateur_definition id ON x_1.indicateur_id = id.id
                  WHERE x_1.collectivite_id = c_1.collectivite_id AND x_1.resultat IS NOT NULL AND id.collectivite_id IS NOT NULL) AS resultats_indicateurs_perso
           FROM stats.collectivite c_1
        )
 SELECT c.collectivite_id,
    ((c.nom::text || ' ('::text) || c.collectivite_id) || ')'::text AS key,
    pc.completude_eci,
    pc.completude_cae,
    x.fiches,
    x.plans,
    x.resultats_indicateurs,
    x.indicateurs_perso,
    x.resultats_indicateurs_perso,
    pr.date AS premier_rattachement,
    ( SELECT count(*) AS count
           FROM fiche_action f
          WHERE f.collectivite_id = c.collectivite_id AND f.titre IS NOT NULL AND (f.description IS NOT NULL OR f.objectifs IS NOT NULL)) AS fiches_initiees,
    ( SELECT count(*) AS count
           FROM fiche_action f
          WHERE f.collectivite_id = c.collectivite_id AND (f.statut IS NOT NULL OR f.niveau_priorite IS NOT NULL OR f.date_debut IS NOT NULL OR f.date_fin_provisoire IS NOT NULL OR (f.id IN ( SELECT fiche_action_structure_tag.fiche_id
                   FROM fiche_action_structure_tag)) OR (f.id IN ( SELECT st.fiche_id
                   FROM fiche_action_pilote st)) OR (f.id IN ( SELECT fiche_action_service_tag.fiche_id
                   FROM fiche_action_service_tag)))) AS fiches_pilotage,
    ( SELECT count(*) AS count
           FROM fiche_action f
          WHERE f.collectivite_id = c.collectivite_id AND (f.id IN ( SELECT fiche_action_indicateur.fiche_id
                   FROM fiche_action_indicateur))) AS fiches_indicateur,
    ( SELECT count(*) AS count
           FROM fiche_action f
          WHERE f.collectivite_id = c.collectivite_id AND (f.id IN ( SELECT fiche_action_action.fiche_id
                   FROM fiche_action_action))) AS fiches_action_referentiel,
    ( SELECT count(*) AS count
           FROM fiche_action f
          WHERE f.collectivite_id = c.collectivite_id AND (f.id IN ( SELECT fiches_liees_par_fiche.fiche_id
                   FROM fiches_liees_par_fiche))) AS fiches_fiche_liee,
    ( SELECT count(*) AS count
           FROM fiche_action f
          WHERE f.collectivite_id = c.collectivite_id AND f.modified_at > (CURRENT_TIMESTAMP - '1 mon'::interval)) AS fiches_mod_1mois,
    ( SELECT count(*) AS count
           FROM fiche_action f
          WHERE f.collectivite_id = c.collectivite_id AND f.modified_at > (CURRENT_TIMESTAMP - '3 mons'::interval)) AS fiches_mod_3mois,
    ( SELECT count(*) AS count
           FROM fiche_action f
          WHERE f.collectivite_id = c.collectivite_id AND f.modified_at > (CURRENT_TIMESTAMP - '6 mons'::interval)) AS fiches_mod_6mois,
    ( SELECT min(f.created_at) AS min
           FROM ( SELECT p.created_at,
                    count(f_1.*) AS nb_fiche
                   FROM fiche_action f_1
                     JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
                     JOIN axe a ON a.id = faa.axe_id
                     JOIN axe p ON a.plan = p.id
                  WHERE f_1.collectivite_id = c.collectivite_id AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text) AND p.nom IS NOT NULL
                  GROUP BY p.id, p.created_at) f
          WHERE f.nb_fiche > 4) AS pa_date_creation,
    ( SELECT count(*) AS count
           FROM visite
          WHERE (visite.page = ANY (ARRAY['plan'::visite_page, 'fiche'::visite_page, 'tableau_de_bord'::visite_page])) AND visite.collectivite_id = c.collectivite_id AND visite."time" >= (CURRENT_TIMESTAMP - '2 mons'::interval)) AS pa_view_2mois,
    ( SELECT count(*) AS count
           FROM visite
          WHERE (visite.page = ANY (ARRAY['plan'::visite_page, 'fiche'::visite_page, 'tableau_de_bord'::visite_page])) AND visite.collectivite_id = c.collectivite_id AND visite."time" >= (CURRENT_TIMESTAMP - '6 mons'::interval)) AS pa_view_6mois,
    ( SELECT count(*) AS count
           FROM ( SELECT p.id,
                    count(f_1.*) AS nb_fiche
                   FROM fiche_action f_1
                     JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
                     JOIN axe a ON a.id = faa.axe_id
                     JOIN axe p ON a.plan = p.id
                  WHERE f_1.collectivite_id = c.collectivite_id AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text) AND p.nom IS NOT NULL
                  GROUP BY p.id) f
          WHERE f.nb_fiche > 4) AS pa_non_vides,
    ( SELECT count(pa.id) AS count
           FROM ( SELECT p.collectivite_id,
                    p.id,
                    count(p.fiche_id) AS nb_fiches
                   FROM ( SELECT f.collectivite_id,
                            p_1.id,
                            f.id AS fiche_id
                           FROM fiche_action f
                             LEFT JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
                             LEFT JOIN fiche_action_structure_tag fas ON fas.fiche_id = f.id
                             LEFT JOIN fiche_action_service_tag faserv ON faserv.fiche_id = f.id
                             JOIN fiche_action_axe faa ON f.id = faa.fiche_id
                             JOIN axe a ON a.id = faa.axe_id
                             JOIN axe p_1 ON a.plan = p_1.id
                          WHERE (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text) AND f.collectivite_id = c.collectivite_id AND f.statut IS NOT NULL AND p_1.nom IS NOT NULL
                          GROUP BY f.collectivite_id, p_1.id, f.id
                         HAVING (count(DISTINCT fap.user_id) + count(DISTINCT fap.tag_id) + count(DISTINCT fas.structure_tag_id) + count(DISTINCT faserv.service_tag_id)) > 0) p
                  GROUP BY p.collectivite_id, p.id) pa
          WHERE pa.nb_fiches > 4) AS pa_pilotables,
    ( SELECT count(*) AS count
           FROM fiche_action f
          WHERE f.collectivite_id = c.collectivite_id AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)) AS fiches_non_vides,
    ( SELECT count(f_2.*) AS count
           FROM ( SELECT f.id
                   FROM fiche_action f
                     LEFT JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
                     LEFT JOIN fiche_action_structure_tag fas ON fas.fiche_id = f.id
                     LEFT JOIN fiche_action_service_tag faserv ON faserv.fiche_id = f.id
                  WHERE f.collectivite_id = c.collectivite_id AND f.titre IS NOT NULL AND f.titre::text <> 'Nouvelle fiche'::text AND f.statut IS NOT NULL
                  GROUP BY f.id
                 HAVING (count(DISTINCT fap.user_id) + count(DISTINCT fap.tag_id) + count(DISTINCT fas.structure_tag_id) + count(DISTINCT faserv.service_tag_id)) > 0) f_2) AS fiches_pilotables,
    ( SELECT count(*) > 4
           FROM fiche_action f
             LEFT JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
          WHERE f.collectivite_id = c.collectivite_id AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text) AND (f.statut IS NOT NULL OR f.niveau_priorite IS NOT NULL OR f.date_fin_provisoire IS NOT NULL OR fap.* IS NOT NULL)) AS _5fiches_1pilotage,
    ( SELECT count(*) AS count
           FROM historique.fiche_action f
          WHERE f.collectivite_id = c.collectivite_id AND (f.previous_statut <> f.statut OR f.previous_statut IS NULL AND f.statut IS NOT NULL OR f.previous_statut IS NOT NULL AND f.statut IS NULL) AND f.modified_at > (CURRENT_TIMESTAMP - '6 mons'::interval)) AS fiches_changement_statut,
        CASE
            WHEN x.fiches = 0 THEN 0::numeric
            ELSE (( SELECT count(*) AS count
               FROM fiche_action f
              WHERE f.collectivite_id = c.collectivite_id AND f.restreint = true))::numeric / x.fiches::numeric * 100::numeric
        END AS pourcentage_fa_privee,
        CASE
            WHEN x.fiches = 0 THEN 0::numeric
            ELSE (( SELECT count(*) AS count
               FROM fiche_action f
                 JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
              WHERE f.collectivite_id = c.collectivite_id AND f.restreint = true AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text) AND f.statut IS NOT NULL))::numeric / x.fiches::numeric * 100::numeric
        END AS pourcentage_fa_pilotable_privee,
    ( SELECT count(ic.*) AS count
           FROM indicateur_collectivite ic
          WHERE ic.collectivite_id = c.collectivite_id AND ic.confidentiel = true) AS indicateur_prive,
    ( SELECT count(ic.*) > 0
           FROM indicateur_collectivite ic
          WHERE ic.collectivite_id = c.collectivite_id AND ic.confidentiel = true) AS min1_indicateur_prive,
    ( SELECT count(ic.*) > 0
           FROM indicateur_collectivite ic
             JOIN indicateur_definition id ON ic.indicateur_id = id.id
          WHERE ic.collectivite_id = c.collectivite_id AND id.collectivite_id IS NULL AND ic.confidentiel = true) AS min1_indicateur_predef_prive,
    ( SELECT count(ic.*) > 0
           FROM indicateur_collectivite ic
             JOIN indicateur_definition id ON ic.indicateur_id = id.id
          WHERE ic.collectivite_id = c.collectivite_id AND id.collectivite_id IS NOT NULL AND ic.confidentiel = true) AS min1_indicateur_perso_prive,
    ( SELECT i.pourcentage
           FROM ( SELECT c_1.id AS collectivite_id,
                        CASE
                            WHEN (( SELECT count(*) AS count
                               FROM indicateur_definition
                              WHERE indicateur_definition.collectivite_id IS NULL)) = 0 THEN 0::double precision
                            ELSE count(ic.*)::double precision / (( SELECT count(*) AS count
                               FROM indicateur_definition
                              WHERE indicateur_definition.collectivite_id IS NULL))::double precision * 100::double precision
                        END AS pourcentage
                   FROM collectivite c_1
                     LEFT JOIN ( SELECT i_1.indicateur_id,
                            i_1.collectivite_id,
                            i_1.commentaire,
                            i_1.confidentiel,
                            i_1.favoris
                           FROM indicateur_collectivite i_1
                             JOIN indicateur_definition id ON i_1.indicateur_id = id.id
                          WHERE i_1.confidentiel = true AND id.collectivite_id IS NULL) ic ON ic.collectivite_id = c_1.id
                  GROUP BY c_1.id) i
          WHERE i.collectivite_id = c.collectivite_id) AS pourcentage_indicateur_predef_prives,
    ( SELECT array_to_string(array_agg(DISTINCT pat.type), ','::text) AS array_to_string
           FROM ( SELECT p.id,
                    count(f_1.*) AS nb_fiche
                   FROM fiche_action f_1
                     JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
                     JOIN axe a_1 ON a_1.id = faa.axe_id
                     JOIN axe p ON a_1.plan = p.id
                  WHERE f_1.collectivite_id = c.collectivite_id AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text) AND p.nom IS NOT NULL
                  GROUP BY p.id) f
             JOIN axe a ON f.id = a.id
             LEFT JOIN plan_action_type pat ON a.type = pat.id
          WHERE f.nb_fiche > 4) AS type_pa_non_vides,
    ( SELECT count(*) AS count
           FROM axe a
          WHERE a.nom = 'Plan d''action à impact'::text AND a.collectivite_id = c.collectivite_id) AS pai,
    ( SELECT count(f_1.*) AS nb_fiches
           FROM fiche_action f_1
             JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
             JOIN axe a ON a.id = faa.axe_id
          WHERE a.nom = 'Plan d''action à impact'::text AND f_1.collectivite_id = c.collectivite_id) AS fiches_pai
   FROM stats.collectivite c
     JOIN stats.collectivite_active USING (collectivite_id)
     LEFT JOIN comptes x USING (collectivite_id)
     LEFT JOIN stats.pourcentage_completude pc USING (collectivite_id)
     LEFT JOIN premier_rattachements pr USING (collectivite_id)
  ORDER BY c.nom
WITH DATA;

CREATE OR REPLACE VIEW public.crm_usages
AS SELECT crm_usages.collectivite_id,
    crm_usages.key,
    crm_usages.completude_eci,
    crm_usages.completude_cae,
    crm_usages.fiches,
    crm_usages.plans,
    crm_usages.resultats_indicateurs,
    crm_usages.indicateurs_perso,
    crm_usages.resultats_indicateurs_perso,
    crm_usages.premier_rattachement,
    crm_usages.fiches_initiees,
    crm_usages.fiches_pilotage,
    crm_usages.fiches_indicateur,
    crm_usages.fiches_action_referentiel,
    crm_usages.fiches_fiche_liee,
    crm_usages.fiches_mod_1mois,
    crm_usages.fiches_mod_3mois,
    crm_usages.fiches_mod_6mois,
    crm_usages.pa_date_creation,
    crm_usages.pa_view_2mois,
    crm_usages.pa_view_6mois,
    crm_usages.pa_non_vides,
    crm_usages.pa_pilotables,
    crm_usages.fiches_non_vides,
    crm_usages.fiches_pilotables,
    crm_usages._5fiches_1pilotage,
    crm_usages.fiches_changement_statut,
    crm_usages.pourcentage_fa_privee,
    crm_usages.pourcentage_fa_pilotable_privee,
    crm_usages.indicateur_prive,
    crm_usages.min1_indicateur_prive,
    crm_usages.min1_indicateur_predef_prive,
    crm_usages.min1_indicateur_perso_prive,
    crm_usages.pourcentage_indicateur_predef_prives,
    crm_usages.type_pa_non_vides,
    crm_usages.pai,
    crm_usages.fiches_pai
   FROM stats.crm_usages
  WHERE is_service_role();


CREATE OR REPLACE FUNCTION stats.amplitude_visite(range tstzrange)
 RETURNS SETOF stats.amplitude_event
 LANGUAGE sql
BEGIN ATOMIC
 WITH auditeurs AS (
          SELECT aa.auditeur AS user_id
            FROM audit_auditeur aa
         )
  SELECT v.user_id,
     (v.page || '_viewed'::text) AS event_type,
     (EXTRACT(epoch FROM v."time"))::integer AS "time",
     md5(((('visite'::text || v.page) || (v.user_id)::text) || (v."time")::text)) AS insert_id,
     jsonb_build_object('page', v.page, 'tag', v.tag, 'onglet', v.onglet, 'collectivite_id', v.collectivite_id, 'niveau_acces', pud.niveau_acces, 'fonction', pcm.fonction, 'champ_intervention', pcm.champ_intervention, 'collectivite', to_json(c.*)) AS event_properties,
     jsonb_build_object('fonctions', ( SELECT array_agg(DISTINCT m.fonction) AS array_agg
            FROM (private_collectivite_membre m
              JOIN private_utilisateur_droit pud_1 ON (((m.user_id = pud_1.user_id) AND (m.collectivite_id = pud_1.collectivite_id))))
           WHERE ((m.user_id = v.user_id) AND (m.fonction IS NOT NULL) AND pud_1.active)), 'auditeur', (v.user_id IN ( SELECT auditeurs.user_id
            FROM auditeurs))) AS user_properties,
     ( SELECT release_version.name
            FROM stats.release_version
           WHERE (release_version."time" < v."time")
           ORDER BY release_version."time" DESC
          LIMIT 1) AS app_version,
     jsonb_build_object('collectivite_id', v.collectivite_id, 'collectivite_nom', ( SELECT nc.nom
            FROM named_collectivite nc
           WHERE (nc.collectivite_id = v.collectivite_id))) AS groups
    FROM (((visite v
      LEFT JOIN private_utilisateur_droit pud ON (((v.user_id = pud.user_id) AND (v.collectivite_id = pud.collectivite_id))))
      LEFT JOIN private_collectivite_membre pcm ON (((v.collectivite_id = pcm.collectivite_id) AND (v.user_id = pcm.user_id))))
      LEFT JOIN stats.collectivite c ON ((v.collectivite_id = c.collectivite_id)))
   WHERE (amplitude_visite.range @> v."time");
END
;

create or replace function
    posthog.event(visite)
    returns table
            (
                event       text,
                "timestamp" text,
                distinct_id text,
                properties  jsonb
            )
    language sql
    stable
    security definer
    rows 1
begin
    atomic
    select '$pageview'                                as event,
           trim(both '"' from to_json($1.time)::text) as timestamp,
           $1.user_id                                 as distinct_id,
           json_build_object(
                   '$current_url',
                   'app/' || (case when $1.collectivite_id is null then '' else 'collectivite/' end) || $1.page,
                   'page', $1.page,
                   'tag', $1.tag,
                   'onglet', $1.onglet,
                   'collectivite_id', $1.collectivite_id::text,
                   'niveau_acces', (select niveau_acces
                                    from private_utilisateur_droit pud
                                    where pud.collectivite_id = $1.collectivite_id
                                      and pud.user_id = $1.user_id),
                   '$set', posthog.properties(p),
                   '$groups', json_build_object('collectivite', $1.collectivite_id::text)
           )                                          as properties
    from dcp p
    where p.user_id = $1.user_id;
end;

create or replace function
    posthog.event(usage)
    returns table
            (
                event       text,
                "timestamp" text,
                distinct_id text,
                properties  jsonb
            )
    language sql
    stable
    security definer
    rows 1
begin
    atomic
    select $1.fonction || '_' || $1.action as event,
           trim(both '"' from to_json($1.time)::text)                as timestamp,
           $1.user_id                      as distinct_id,
           json_build_object(
                   '$current_url',
                   'app/' || (case when $1.collectivite_id is null then '' else 'collectivite/' end) || $1.page,
                   'page', $1.page,
                   'collectivite_id', $1.collectivite_id::text,
                   'niveau_acces', (select niveau_acces
                                    from private_utilisateur_droit pud
                                    where pud.collectivite_id = $1.collectivite_id
                                      and pud.user_id = $1.user_id),
                   '$set', posthog.properties(p),
                   '$groups', json_build_object('collectivite', $1.collectivite_id::text)
           )                               as properties
    from dcp p
    where p.user_id = $1.user_id;
end;

COMMIT;
