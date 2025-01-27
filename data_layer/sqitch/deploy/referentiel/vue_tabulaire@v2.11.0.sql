-- Deploy tet:referentiel/vue_tabulaire to pg
-- requires: referentiel/contenu
-- requires: referentiel/action_statut
-- requires: evaluation/score_summary

BEGIN;

create view private.action_hierarchy
as
with recursive
    actions_from_parents as
        -- +---------+-------------------+-----+
        -- |id       |parents            |depth|
        -- +---------+-------------------+-----+
        -- |eci_2.2.0|{eci,eci_2,eci_2.2}|3    |
        -- |eci_2.2.1|{eci,eci_2,eci_2.2}|3    |
        (
            -- Actions with no parent, our starting point
            select id, referentiel, '{}'::action_id[] as parents, 0 as depth
            from action_relation
            where action_relation.parent is null

            union all

            -- Recursively find sub-actions and append them to the result-set
            select c.id, c.referentiel, parents || c.parent, depth + 1
            from actions_from_parents p
                     join action_relation c
                          on c.parent = p.id
            where not c.id = any (parents)),
    parent_descendants as
        -- +-------+---------------------------------------------+
        -- |p      |descendants                                  |
        -- +-------+---------------------------------------------+
        -- |cae    |{cae_2,cae_6,cae_3,cae_1,... cae_2.1.2.6,...}|
        -- |cae_1  |{cae_1.1,cae_1.2,cae_1.3,...,cae_1.2.4,...}  |
        -- |cae_1.1|{cae_1.1.2,cae_1.1.3,...,cae_1.1.3.3...}     |
        (select ar.id, array_agg(afp.id) as descendants
         from action_relation ar
                  join actions_from_parents afp on ar.id = any (afp.parents)
         group by ar.id),
    parent_leaves as
        -- +-------+---------------------------------------------+
        -- |p      |descendants                                  |
        -- +-------+---------------------------------------------+
        -- |cae    |{cae_2,cae_6,cae_3,cae_1,... cae_2.1.2.6,...}|
        -- |cae_1  |{cae_1.1,cae_1.2,cae_1.3,...,cae_1.2.4,...}  |
        -- |cae_1.1|{cae_1.1.2,cae_1.1.3,...,cae_1.1.3.3...}     |
        (select ar.id,
                array_agg(afp.id) filter ( where d is null ) as leaves
         from action_relation ar
                  join actions_from_parents afp on ar.id = any (afp.parents)
                  left join parent_descendants d on d.id = afp.id
         group by ar.id)
-- +---+-------------------------------------+-----+
-- |id |children                             |depth|
-- +---+-------------------------------------+-----+
-- |cae|{cae_4,cae_5,cae_2,cae_6,cae_1,cae_3}|0    |
-- |eci|{eci_2,eci_3,eci_4,eci_1,eci_5}      |0    |
select actions_from_parents.id                                     as action_id,
       actions_from_parents.referentiel                            as referentiel,
       coalesce(parent_descendants.descendants, '{}'::action_id[]) as descendants,
       coalesce(parent_leaves.leaves, '{}'::action_id[])           as leaves,
       parent_descendants.descendants is not null                  as have_children,
       actions_from_parents.parents                                as ascendants,
       actions_from_parents.depth                                  as depth,
       coalesce(
               case
                   when actions_from_parents.referentiel = 'cae'
                       then ('{"axe", "sous-axe", "action", "sous-action", "tache"}'::action_type[])[actions_from_parents.depth]
                   else ('{"axe", "action", "sous-action", "tache"}'::action_type[])[actions_from_parents.depth]
                   end
           , 'referentiel')                                        as type
from actions_from_parents
         left join parent_descendants on actions_from_parents.id = parent_descendants.id
         left join parent_leaves on parent_leaves.id = parent_descendants.id
order by naturalsort(actions_from_parents.id);

comment on view private.action_hierarchy
    is 'Vue dynamique qui calcule la hiérarchie des actions. Dépréciée, préférer `private.action_node`.';

CREATE OR REPLACE VIEW public.historique
AS WITH question_actions AS (
         SELECT question_action.question_id,
            array_agg(question_action.action_id) AS action_ids
           FROM question_action
          GROUP BY question_action.question_id
        ), historiques AS (
         SELECT 'action_statut'::text AS type,
            s.collectivite_id,
            s.modified_by AS modified_by_id,
            s.previous_modified_by AS previous_modified_by_id,
            s.modified_at,
            s.previous_modified_at,
            s.action_id,
            s.avancement,
            COALESCE(s.previous_avancement, 'non_renseigne'::avancement) AS previous_avancement,
            s.avancement_detaille,
            s.previous_avancement_detaille,
            s.concerne,
            s.previous_concerne,
            NULL::text AS "precision",
            NULL::text AS previous_precision,
            NULL::character varying::question_id AS question_id,
            NULL::question_type AS question_type,
            NULL::jsonb AS reponse,
            NULL::jsonb AS previous_reponse
           FROM historique.action_statut s
        UNION ALL
         SELECT 'action_precision'::text,
            p.collectivite_id,
            p.modified_by,
            p.previous_modified_by,
            p.modified_at,
            p.previous_modified_at,
            p.action_id,
            NULL::avancement,
            NULL::avancement,
            NULL::numeric[],
            NULL::numeric[],
            NULL::boolean,
            NULL::boolean,
            p."precision",
            p.previous_precision,
            NULL::character varying,
            NULL::question_type,
            NULL::jsonb,
            NULL::jsonb
           FROM historique.action_precision p
        UNION ALL
         SELECT 'reponse'::text,
            reponse_display.collectivite_id,
            reponse_display.modified_by,
            reponse_display.previous_modified_by,
            reponse_display.modified_at,
            reponse_display.previous_modified_at,
            NULL::character varying,
            NULL::avancement,
            NULL::avancement,
            NULL::numeric[],
            NULL::numeric[],
            NULL::boolean,
            NULL::boolean,
            NULL::text AS "precision",
            NULL::text AS previous_precision,
            reponse_display.question_id,
            reponse_display.question_type,
            reponse_display.reponse,
            reponse_display.previous_reponse
           FROM historique.reponse_display
        ), actions AS (
         SELECT ah_1.action_id,
            ah_1.referentiel,
            ah_1.descendants,
            ah_1.leaves,
            ah_1.have_children,
            ah_1.ascendants,
            ah_1.depth,
            ah_1.type
           FROM private.action_hierarchy ah_1
          WHERE ah_1.type = 'action'::action_type
        )
 SELECT h.type,
    h.collectivite_id,
    COALESCE(h.modified_by_id, '99999999-9999-9999-9999-999999999999'::uuid) AS modified_by_id,
    h.previous_modified_by_id,
    h.modified_at,
    h.previous_modified_at,
    h.action_id,
    h.avancement,
    h.previous_avancement,
    h.avancement_detaille,
    h.previous_avancement_detaille,
    h.concerne,
    h.previous_concerne,
    h."precision",
    h.previous_precision,
    h.question_id,
    h.question_type,
    h.reponse,
    h.previous_reponse,
    COALESCE((ud.prenom || ' '::text) || ud.nom, 'Équipe territoires en transitions'::text) AS modified_by_nom,
    td.identifiant AS tache_identifiant,
    td.nom AS tache_nom,
    ad.identifiant AS action_identifiant,
    ad.nom AS action_nom,
    q.formulation AS question_formulation,
    q.thematique_id,
    qt.nom AS thematique_nom,
    COALESCE(qa.action_ids, ARRAY[h.action_id]::action_id[]) AS action_ids
   FROM historiques h
     LEFT JOIN actions ah ON h.action_id::text = ANY (ah.descendants::text[])
     LEFT JOIN action_definition ad ON ah.action_id::text = ad.action_id::text
     LEFT JOIN action_definition td ON h.action_id::text = td.action_id::text
     LEFT JOIN utilisateur.dcp_display ud ON h.modified_by_id = ud.user_id
     LEFT JOIN question q ON h.question_id::text = q.id::text
     LEFT JOIN question_thematique qt ON q.thematique_id::text = qt.id::text
     LEFT JOIN question_actions qa ON h.question_id::text = qa.question_id::text
  WHERE have_lecture_acces(h.collectivite_id)
  ORDER BY h.modified_at DESC;

CREATE OR REPLACE VIEW public.action_statuts
AS SELECT c.id AS collectivite_id,
    d.action_id,
    d.referentiel,
    h.type,
    h.descendants,
    h.ascendants,
    h.depth,
    h.have_children,
    d.identifiant,
    d.nom,
    d.description,
    d.exemples <> ''::text AS have_exemples,
    d.preuve <> ''::text AS have_preuve,
    d.ressources <> ''::text AS have_ressources,
    d.reduction_potentiel <> ''::text AS have_reduction_potentiel,
    d.perimetre_evaluation <> ''::text AS have_perimetre_evaluation,
    d.contexte <> ''::text AS have_contexte,
    d.categorie AS phase,
        CASE
            WHEN sc.point_potentiel = 0::double precision THEN 0::double precision
            ELSE sc.point_fait / sc.point_potentiel
        END AS score_realise,
        CASE
            WHEN sc.point_potentiel = 0::double precision THEN 0::double precision
            ELSE sc.point_programme / sc.point_potentiel
        END AS score_programme,
        CASE
            WHEN sc.point_potentiel = 0::double precision THEN 0::double precision
            ELSE (sc.point_fait + sc.point_programme) / sc.point_potentiel
        END AS score_realise_plus_programme,
        CASE
            WHEN sc.point_potentiel = 0::double precision THEN 0::double precision
            ELSE sc.point_pas_fait / sc.point_potentiel
        END AS score_pas_fait,
        CASE
            WHEN sc.point_potentiel = 0::double precision THEN 0::double precision
            ELSE sc.point_non_renseigne / sc.point_potentiel
        END AS score_non_renseigne,
    GREATEST(sc.point_potentiel - sc.point_fait, 0::double precision) AS points_restants,
    sc.point_fait AS points_realises,
    sc.point_programme AS points_programmes,
    sc.point_potentiel AS points_max_personnalises,
    sc.point_referentiel AS points_max_referentiel,
    s.avancement,
    s.avancement_detaille,
    cs.avancements AS avancement_descendants,
    COALESCE(NOT s.concerne, cs.non_concerne, false) AS non_concerne
   FROM public.collectivite c
     LEFT JOIN public.action_definition d ON true
     JOIN private.action_hierarchy h ON d.action_id::text = h.action_id::text
     LEFT JOIN public.action_statut s ON c.id = s.collectivite_id AND s.action_id::text = d.action_id::text
     LEFT JOIN private.action_scores sc ON c.id = sc.collectivite_id AND sc.action_id::text = d.action_id::text
     LEFT JOIN LATERAL ( SELECT
                CASE
                    WHEN NOT h.have_children THEN '{}'::public.avancement[]
                    WHEN sc.point_non_renseigne = sc.point_potentiel THEN '{non_renseigne}'::public.avancement[]
                    WHEN sc.point_non_renseigne > 0.0::double precision THEN '{non_renseigne}'::public.avancement[] || array_agg(DISTINCT statut.avancement) FILTER (WHERE statut.concerne)
                    ELSE array_agg(DISTINCT statut.avancement) FILTER (WHERE statut.concerne)
                END AS avancements,
            NOT bool_and(statut.concerne) AS non_concerne
           FROM public.action_statut statut
          WHERE c.id = statut.collectivite_id AND (statut.action_id::text = ANY (h.leaves::text[]))) cs ON true
  WHERE sc.* IS NULL OR sc.concerne AND NOT sc.desactive
  ORDER BY c.id, (public.naturalsort(d.identifiant));

CREATE OR REPLACE VIEW public.action_audit_state
AS WITH action AS (
         SELECT ar_1.action_id
           FROM private.action_hierarchy ar_1
          WHERE ar_1.type = 'action'::public.action_type
        )
 SELECT ar.action_id,
    aas.id AS state_id,
    aas.statut,
    aas.avis,
    aas.ordre_du_jour,
    a.id AS audit_id,
    a.collectivite_id,
    a.referentiel
   FROM action ar
     LEFT JOIN labellisation.action_audit_state aas ON ar.action_id::text = aas.action_id::text
     JOIN public.audit a ON aas.audit_id = a.id;

CREATE OR REPLACE VIEW public.suivi_audit
AS SELECT c.id AS collectivite_id,
    ah.referentiel,
    ah.action_id,
    ah.have_children,
    ah.type,
    COALESCE(s.statut, 'non_audite'::public.audit_statut) AS statut,
    cs.statuts,
    s.avis,
    s.ordre_du_jour,
    cs.ordres_du_jour
   FROM public.collectivite c
     JOIN private.action_hierarchy ah ON true
     LEFT JOIN public.action_audit_state s ON s.action_id::text = ah.action_id::text AND s.collectivite_id = c.id
     LEFT JOIN LATERAL ( SELECT
                CASE
                    WHEN s.statut IS NULL THEN COALESCE(array_agg(DISTINCT aas.statut), '{non_audite}'::public.audit_statut[])
                    ELSE '{}'::public.audit_statut[]
                END AS statuts,
                CASE
                    WHEN s.statut IS NULL THEN COALESCE(array_agg(DISTINCT aas.ordre_du_jour), '{f}'::boolean[])
                    ELSE '{}'::boolean[]
                END AS ordres_du_jour
           FROM public.action_audit_state aas
             JOIN private.action_hierarchy iah ON iah.action_id::text = aas.action_id::text
          WHERE aas.collectivite_id = c.id AND iah.type = 'action'::public.action_type AND (aas.action_id::text = ANY (ah.descendants::text[]))) cs ON true
  WHERE ah.type = 'axe'::public.action_type OR ah.type = 'sous-axe'::public.action_type OR ah.type = 'action'::public.action_type
  ORDER BY (public.naturalsort(ah.action_id::text));

drop view retool_score;
CREATE OR REPLACE VIEW public.retool_score
AS SELECT c.collectivite_id,
    c.nom AS "Collectivité",
    d.referentiel,
    d.identifiant AS "Identifiant",
    d.nom AS "Titre",
    sc.point_potentiel AS "Points potentiels",
    sc.point_fait AS "Points realisés",
        CASE
            WHEN sc.point_potentiel = 0::double precision THEN 0::double precision
            ELSE sc.point_fait / sc.point_potentiel * 100::double precision
        END AS "Pourcentage réalisé",
    sc.point_programme AS "Points programmés",
        CASE
            WHEN sc.point_programme = 0::double precision THEN 0::double precision
            ELSE sc.point_programme / sc.point_potentiel * 100::double precision
        END AS "Pourcentage programmé",
        CASE
            WHEN sc.point_potentiel = 0::double precision THEN 0::double precision
            ELSE sc.point_non_renseigne / sc.point_potentiel * 100::double precision
        END AS "Pourcentage non renseigné",
        CASE
            WHEN NOT sc.concerne OR sc.desactive THEN 'Non concerné'::character varying
            WHEN sc.completed_taches_count = 0::double precision THEN 'Non renseigné'::character varying
            ELSE COALESCE(s.avancement::character varying, ''::character varying)
        END AS "Avancement",
        CASE
            WHEN ah.type = 'sous-action'::public.action_type THEN COALESCE(ac.commentaire || '
'::text, ''::text) || (( SELECT string_agg('- '::text || a.commentaire, '
'::text) AS string_agg
               FROM public.action_commentaire a
              WHERE a.collectivite_id = c.collectivite_id AND (a.action_id::text = ANY (ah.descendants::text[])) AND a.commentaire <> ''::text))
            ELSE ac.commentaire
        END AS "Commentaires fusionnés",
    ac.commentaire AS "Commentaire"
   FROM public.named_collectivite c
     LEFT JOIN public.action_definition d ON true
     JOIN private.action_hierarchy ah ON d.action_id::text = ah.action_id::text
     LEFT JOIN public.action_statut s ON c.collectivite_id = s.collectivite_id AND s.action_id::text = d.action_id::text
     LEFT JOIN private.action_scores sc ON c.collectivite_id = sc.collectivite_id AND sc.action_id::text = d.action_id::text
     LEFT JOIN public.action_commentaire ac ON d.action_id::text = ac.action_id::text AND c.collectivite_id = ac.collectivite_id
  WHERE public.is_service_role()
  ORDER BY c.collectivite_id, d.referentiel, (public.naturalsort(d.identifiant));

DROP VIEW public.action_hierarchy;

create materialized view private.action_node
as
select action_id,
       referentiel,
       descendants,
       leaves,
       have_children,
       ascendants,
       depth,
       type
from private.action_hierarchy;
comment on materialized view private.action_node
    is 'La vue matérialisée des actions.';

create materialized view action_referentiel
as
select -- les champs dérivés des relations.
       ah.action_id,
       ah.referentiel,
       ah.descendants,
       ah.leaves,
       ah.have_children,
       ah.ascendants,
       ah.depth,
       ah.type,

       -- les champs descriptions
       ad.identifiant,
       ad.nom,
       ad.description,
       ad.categorie                  as phase,

       -- les champs dérivés des descriptions
       ad.exemples != ''             as have_exemples,
       ad.preuve != ''               as have_preuve,
       ad.ressources != ''           as have_ressources,
       ad.reduction_potentiel != ''  as have_reduction_potentiel,
       ad.perimetre_evaluation != '' as have_perimetre_evaluation,
       ad.contexte != ''             as have_contexte
from private.action_hierarchy ah
         left join action_definition ad on ah.action_id = ad.action_id;
comment on materialized view action_referentiel
    is 'La vue matérialisée utilisée comme tronc commun pour les vues tabulaires dans le client.';


create type tabular_score as
(
    referentiel                  referentiel,
    action_id                    action_id,
    -- score
    score_realise                double precision,
    score_programme              double precision,
    score_realise_plus_programme double precision,
    score_pas_fait               double precision,
    score_non_renseigne          double precision,
    -- points
    points_restants              double precision,
    points_realises              double precision,
    points_programmes            double precision,
    points_max_personnalises     double precision,
    points_max_referentiel       double precision,
    -- avancement reconstitué
    avancement                   avancement,
    -- booléens
    concerne                     bool,
    desactive                    bool
);
comment on type tabular_score
    is 'Un score utilisé pour être affiché dans le client. ';

create function
    private.to_tabular_score(
    action_score private.action_score
)
    returns tabular_score
begin
    atomic
    select action_score.referentiel,
           action_score.action_id,
           -- score [0.0, 1.0]
           case
               when action_score.point_potentiel = 0 then 0
               else action_score.point_fait / action_score.point_potentiel end,
           case
               when action_score.point_potentiel = 0 then 0
               else action_score.point_programme / action_score.point_potentiel end,
           case
               when action_score.point_potentiel = 0 then 0
               else (action_score.point_fait + action_score.point_programme) /
                    action_score.point_potentiel end,
           case
               when action_score.point_potentiel = 0 then 0
               else action_score.point_pas_fait / action_score.point_potentiel end,
           case
               when action_score.point_potentiel = 0 then 0
               else action_score.point_non_renseigne / action_score.point_potentiel end,
           -- points
           greatest(action_score.point_potentiel - action_score.point_fait, 0),
           action_score.point_fait,
           action_score.point_programme,
           action_score.point_potentiel,
           action_score.point_referentiel,
           -- avancement reconstitué
           case
               when action_score.fait_taches_avancement = 1 then 'fait'
               when action_score.programme_taches_avancement = 1 then 'programme'
               when action_score.pas_fait_taches_avancement = 1 then 'pas_fait'
               when action_score.fait_taches_avancement +
                    action_score.programme_taches_avancement +
                    action_score.pas_fait_taches_avancement = 0 then 'non_renseigne'
               else 'detaille' end::avancement,
           -- booléens
           action_score.concerne,
           action_score.desactive;
end;
comment on function private.to_tabular_score is
    'Convertit un action score en score pour les vues tabulaires.';


create or replace view action_statuts
as
select -- Le client filtre sur:
       c.id                                               as collectivite_id,
       d.action_id,
       d.referentiel,
       d.type,
       d.descendants,
       d.ascendants,
       d.depth,
       d.have_children,

       -- et éventuellement sélectionne:
       d.identifiant,
       d.nom,
       d.description,
       d.have_exemples,
       d.have_preuve,
       d.have_ressources,
       d.have_reduction_potentiel,
       d.have_perimetre_evaluation,
       d.have_contexte,
       d.phase,

       -- les scores [0.0, 1.0]
       sc.score_realise,
       sc.score_programme,
       sc.score_realise_plus_programme,
       sc.score_pas_fait,
       sc.score_non_renseigne,

       -- les points
       sc.points_restants,
       sc.points_realises,
       sc.points_programmes,
       sc.points_max_personnalises,
       sc.points_max_referentiel,

       -- les statuts saisis
       s.avancement,
       s.avancement_detaille,

       -- les statuts des enfants
       cs.avancements                                     as avancement_descendants,
       coalesce((not s.concerne), cs.non_concerne, false) as non_concerne

-- pour chaque collectivité
from collectivite c
         -- on prend les scores au format json pour chaque référentiel
         join client_scores on client_scores.collectivite_id = c.id
    -- que l'on explose en lignes, une par action
         join private.convert_client_scores(client_scores.scores) ccc on true
    -- puis on converti chacune de ces lignes au format approprié pour les vues tabulaires du client
         join private.to_tabular_score(ccc) sc on true
    -- on y join la définition de l'action
         join action_referentiel d on sc.action_id = d.action_id
    -- et les statuts saisis si ils existent (left join)
         left join action_statut s on c.id = s.collectivite_id and s.action_id = d.action_id
    -- pour chacune de ces lignes on agrège les avancements des descendants, afin de pouvoir les filtrer
         left join lateral (
    select case
               -- aucun descendant
               when not d.have_children then
                   '{}'::avancement[]
               -- aucun statut pour les enfants
               when ccc.point_non_renseigne = ccc.point_potentiel then
                   '{non_renseigne}'::avancement[]
               -- des statuts mais pas pour chaque enfant
               when ccc.point_non_renseigne > 0.0 then
                       '{non_renseigne}'::avancement[] ||
                       array_agg(distinct statut.avancement) filter ( where statut.concerne )
               -- des statuts pour chaque enfant
               else
                   array_agg(distinct statut.avancement) filter ( where statut.concerne )
               end
               as avancements,
           not bool_and(statut.concerne)
               as non_concerne
    from action_statut statut
    where c.id = statut.collectivite_id
      and statut.action_id = any (d.leaves)
    ) cs on true
-- on fini par exclure les désactivés et les non concernés.
where sc is null
   or (ccc.concerne and not ccc.desactive)
order by c.id,
         naturalsort(d.identifiant);

COMMIT;
