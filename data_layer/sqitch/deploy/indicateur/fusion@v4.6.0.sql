-- Deploy tet:indicateur/fusion to pg

BEGIN;

DROP TYPE IF EXISTS public.indicateur_generique;


-- 1. Drop en cascade les views et fonctions dépendantes de public.fiche_action :
-- -> vw private.fiches_action
--    ↪ vw public.fiches_action
--      ↪ fn public.plan_action_export


drop function public.plan_action_export;
drop view public.fiches_action;
drop view private.fiches_action;



-- 2. Pour pouvoir remplacer le champ budget_previsionnel (int4) de la table fiche_action par du bigint
ALTER TABLE historique.fiche_action 
ALTER COLUMN budget_previsionnel TYPE NUMERIC(12);

ALTER TABLE historique.fiche_action 
ALTER COLUMN previous_budget_previsionnel TYPE NUMERIC(12);

ALTER TABLE public.fiche_action 
ALTER COLUMN budget_previsionnel TYPE NUMERIC(12);



-- 3. Puis, recrée les vues et fonctions dépendantes
create view private.fiches_action as
SELECT fa.modified_at,
       fa.id,
       fa.titre,
       fa.description,
       fa.piliers_eci,
       fa.objectifs,
       fa.resultats_attendus,
       fa.cibles,
       fa.ressources,
       fa.financements,
       fa.budget_previsionnel,
       fa.statut,
       fa.niveau_priorite,
       fa.date_debut,
       fa.date_fin_provisoire,
       fa.amelioration_continue,
       fa.calendrier,
       fa.notes_complementaires,
       fa.maj_termine,
       fa.collectivite_id,
       fa.created_at,
       fa.modified_by,
       t.thematiques,
       st.sous_thematiques,
       p.partenaires,
       s.structures,
       (SELECT array_agg(ROW (pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) AS array_agg
        FROM (SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                     pt.collectivite_id,
                     fap.tag_id,
                     fap.user_id
              FROM fiche_action_pilote fap
              LEFT JOIN personne_tag pt ON fap.tag_id = pt.id
              LEFT JOIN dcp ON fap.user_id = dcp.user_id
              WHERE fap.fiche_id = fa.id) pil)  AS pilotes,
       (SELECT array_agg(ROW (ref.nom, ref.collectivite_id, ref.tag_id, ref.user_id)::personne) AS array_agg
        FROM (SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                     pt.collectivite_id,
                     far.tag_id,
                     far.user_id
              FROM fiche_action_referent far
              LEFT JOIN personne_tag pt ON far.tag_id = pt.id
              LEFT JOIN dcp ON far.user_id = dcp.user_id
              WHERE far.fiche_id = fa.id) ref)  AS referents,
       pla.axes,
       act.actions,
       (SELECT array_agg(indi.*::indicateur_definition) AS array_agg
        FROM (SELECT id.*
              FROM fiche_action_indicateur fai
              JOIN indicateur_definition id ON fai.indicateur_id::text = id.id::text
              WHERE fai.fiche_id = fa.id) indi) AS indicateurs,
       ser.services,
       (SELECT array_agg(ROW (fin.financeur_tag, fin.montant_ttc, fin.id)::financeur_montant) AS financeurs
        FROM (SELECT ft.*::financeur_tag AS financeur_tag,
                     faft.montant_ttc,
                     faft.id
              FROM financeur_tag ft
              JOIN fiche_action_financeur_tag faft ON ft.id = faft.financeur_tag_id
              WHERE faft.fiche_id = fa.id) fin) AS financeurs,
       fic.fiches_liees,
       fa.restreint
FROM fiche_action fa
LEFT JOIN (SELECT fath.fiche_id,
                  array_agg(th.*) AS thematiques
           FROM thematique th
           JOIN fiche_action_thematique fath ON fath.thematique_id = th.id
           GROUP BY fath.fiche_id) t ON t.fiche_id = fa.id
LEFT JOIN (SELECT fasth.fiche_id,
                  array_agg(sth.*) AS sous_thematiques
           FROM sous_thematique sth
           JOIN fiche_action_sous_thematique fasth ON fasth.thematique_id = sth.id
           GROUP BY fasth.fiche_id) st ON st.fiche_id = fa.id
LEFT JOIN (SELECT fapt.fiche_id,
                  array_agg(pt.*) AS partenaires
           FROM partenaire_tag pt
           JOIN fiche_action_partenaire_tag fapt ON fapt.partenaire_tag_id = pt.id
           GROUP BY fapt.fiche_id) p ON p.fiche_id = fa.id
LEFT JOIN (SELECT fast.fiche_id,
                  array_agg(st_1.*) AS structures
           FROM structure_tag st_1
           JOIN fiche_action_structure_tag fast ON fast.structure_tag_id = st_1.id
           GROUP BY fast.fiche_id) s ON s.fiche_id = fa.id
LEFT JOIN (SELECT fapa.fiche_id,
                  array_agg(pa.*) AS axes
           FROM axe pa
           JOIN fiche_action_axe fapa ON fapa.axe_id = pa.id
           GROUP BY fapa.fiche_id) pla ON pla.fiche_id = fa.id
LEFT JOIN (SELECT faa.fiche_id,
                  array_agg(ar.*) AS actions
           FROM action_relation ar
           JOIN fiche_action_action faa ON faa.action_id::text = ar.id::text
           GROUP BY faa.fiche_id) act ON act.fiche_id = fa.id
LEFT JOIN (SELECT fast.fiche_id,
                  array_agg(st_1.*) AS services
           FROM service_tag st_1
           JOIN fiche_action_service_tag fast ON fast.service_tag_id = st_1.id
           GROUP BY fast.fiche_id) ser ON ser.fiche_id = fa.id
LEFT JOIN (SELECT falpf.fiche_id,
                  array_agg(fr.*) AS fiches_liees
           FROM private.fiche_resume fr
           JOIN fiches_liees_par_fiche falpf ON falpf.fiche_liee_id = fr.id
           GROUP BY falpf.fiche_id) fic ON fic.fiche_id = fa.id;


create view public.fiches_action as
SELECT fiches_action.modified_at,
       fiches_action.id,
       fiches_action.titre,
       fiches_action.description,
       fiches_action.piliers_eci,
       fiches_action.objectifs,
       fiches_action.resultats_attendus,
       fiches_action.cibles,
       fiches_action.ressources,
       fiches_action.financements,
       fiches_action.budget_previsionnel,
       fiches_action.statut,
       fiches_action.niveau_priorite,
       fiches_action.date_debut,
       fiches_action.date_fin_provisoire,
       fiches_action.amelioration_continue,
       fiches_action.calendrier,
       fiches_action.notes_complementaires,
       fiches_action.maj_termine,
       fiches_action.collectivite_id,
       fiches_action.created_at,
       fiches_action.modified_by,
       fiches_action.thematiques,
       fiches_action.sous_thematiques,
       fiches_action.partenaires,
       fiches_action.structures,
       fiches_action.pilotes,
       fiches_action.referents,
       fiches_action.axes,
       fiches_action.actions,
       fiches_action.indicateurs,
       fiches_action.services,
       fiches_action.financeurs,
       fiches_action.fiches_liees,
       fiches_action.restreint
FROM private.fiches_action
WHERE CASE
          WHEN fiches_action.restreint = true THEN have_lecture_acces(fiches_action.collectivite_id) OR est_support()
          ELSE can_read_acces_restreint(fiches_action.collectivite_id)
      END;

create trigger upsert
    instead of insert or update
    on public.fiches_action
    for each row
execute procedure upsert_fiche_action();



create function public.plan_action_export(id integer) returns SETOF fiche_action_export
    language sql
BEGIN ATOMIC
WITH RECURSIVE parents AS (
                          SELECT axe.id,
                                 axe.nom,
                                 axe.collectivite_id,
                                 0 AS depth,
                                 ARRAY[]::text[] AS path,
                                 ('0 '::text || axe.nom) AS sort_path
                          FROM axe
                          WHERE ((axe.parent IS NULL) AND (axe.id = plan_action_export.id) AND can_read_acces_restreint(axe.collectivite_id))
                          UNION ALL
                          SELECT a.id,
                                 a.nom,
                                 a.collectivite_id,
                                 (p_1.depth + 1),
                                 (p_1.path || p_1.nom),
                                 ((((p_1.sort_path || ' '::text) || (p_1.depth + 1)) || ' '::text) || a.nom)
                          FROM (parents p_1
                              JOIN axe a ON ((a.parent = p_1.id)))
                          ), fiches AS (
                          SELECT a.id AS axe_id,
                                 f_1.*::fiches_action AS fiche,
                                 f_1.titre
                          FROM ((parents a
                              JOIN fiche_action_axe faa ON ((a.id = faa.axe_id)))
                              JOIN fiches_action f_1 ON (((f_1.collectivite_id = a.collectivite_id) AND (faa.fiche_id = f_1.id))))
                          )
SELECT p.id,
       p.nom,
       p.path,
       to_jsonb(f.*) AS to_jsonb
FROM (parents p
    LEFT JOIN fiches f ON ((p.id = f.axe_id)))
ORDER BY (naturalsort((p.sort_path || (COALESCE(f.titre, ''::character varying))::text)));
END;



COMMIT;
