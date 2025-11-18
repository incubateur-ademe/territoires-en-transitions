-- Deploy tet:notes_complementaires_column_deletion to pg

BEGIN;

--
-- BEFORE. Drop related functions and views before dropping the notes_complementaires column
DROP TRIGGER IF EXISTS save_history ON public.fiche_action;
DROP FUNCTION historique.save_fiche_action();
DROP FUNCTION public.plan_action_export(id integer);
DROP TRIGGER IF EXISTS upsert ON public.fiches_action;
DROP VIEW public.fiches_action;
DROP VIEW private.fiches_action;

-- Remove the notes_complementaires column from fiche_action table
-- This column has been migrated to fiche_action_note table
alter table public.fiche_action
    drop column notes_complementaires;

-- Also remove from historique.fiche_action table
alter table historique.fiche_action
    drop column notes_complementaires,
    drop column previous_notes_complementaires;


-- Recreate the view with the old fields
create view private.fiches_action
as
SELECT fa.modified_at,
       fa.id,
       fa.titre,
       fa.description,
       fa.piliers_eci,
       fa.objectifs,
       eff.resultats_attendus,
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
       fa.instance_gouvernance,
       fa.participation_citoyenne,
       fa.participation_citoyenne_type,
       CASE
          WHEN tmo.niveau IS NULL THEN NULL::jsonb
          ELSE jsonb_build_object('id', tmo.niveau, 'nom', tmo.nom)
       END as temps_de_mise_en_oeuvre,
       CASE
          WHEN fa.created_by IS NULL THEN NULL::jsonb
          ELSE jsonb_build_object('user_id', created_user.user_id, 'nom', created_user.nom, 'prenom', created_user.prenom, 'email', created_user.email)
       END as created_by,
       fa.maj_termine,
       fa.collectivite_id,
       fa.created_at,
       CASE
          WHEN fa.modified_by IS NULL THEN NULL::jsonb
          ELSE jsonb_build_object('user_id', modified_user.user_id, 'nom', modified_user.nom, 'prenom', modified_user.prenom, 'email', modified_user.email)
       END AS modified_by,
       t.thematiques,
       st.sous_thematiques,
       p.partenaires,
       s.structures,
       (
       SELECT array_agg(ROW (pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) AS array_agg
       FROM (
            SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                   pt.collectivite_id,
                   fap.tag_id,
                   fap.user_id
            FROM fiche_action_pilote fap
            LEFT JOIN personne_tag pt ON fap.tag_id = pt.id
            LEFT JOIN dcp ON fap.user_id = dcp.user_id
            WHERE fap.fiche_id = fa.id
            ) pil
       ) AS pilotes,
       (
       SELECT array_agg(ROW (ref.nom, ref.collectivite_id, ref.tag_id, ref.user_id)::personne) AS array_agg
       FROM (
            SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                   pt.collectivite_id,
                   far.tag_id,
                   far.user_id
            FROM fiche_action_referent far
            LEFT JOIN personne_tag pt ON far.tag_id = pt.id
            LEFT JOIN dcp ON far.user_id = dcp.user_id
            WHERE far.fiche_id = fa.id
            ) ref
       ) AS referents,
       pla.axes,
       act.actions,
       (
       SELECT array_agg(ROW (
         indi.id, 
         indi.groupement_id, 
         indi.collectivite_id, 
         indi.identifiant_referentiel,
         indi.titre, 
         indi.titre_long,
         indi.description,
         indi.unite, 
         indi.borne_min,
         indi.borne_max,
         indi.participation_score, 
         indi.sans_valeur_utilisateur,
         indi.valeur_calcule, 
         indi.modified_at,
         indi.created_at,
         indi.modified_by, 
         indi.created_by,
         NULL::text,
         NULL::character varying(16),
         NULL::integer,
         NULL,
         NULL,
         NULL
         )::indicateur_definition) AS array_agg
       FROM (
            SELECT id.id,
                   id.groupement_id,
                   id.collectivite_id,
                   id.identifiant_referentiel,
                   id.titre,
                   id.titre_long,
                   id.description,
                   id.unite,
                   id.borne_min,
                   id.borne_max,
                   id.participation_score,
                   id.sans_valeur_utilisateur,
                   id.valeur_calcule,
                   id.modified_at,
                   id.created_at,
                   id.modified_by,
                   id.created_by
            FROM fiche_action_indicateur fai
            JOIN indicateur_definition id ON fai.indicateur_id::text = id.id::text
            WHERE fai.fiche_id = fa.id
            ) indi
       ) AS indicateurs,
       ser.services,
       lib.libres_tag,
       (
       SELECT array_agg(ROW (fin.financeur_tag, fin.montant_ttc, fin.id)::financeur_montant) AS financeurs
       FROM (
            SELECT ft.*::financeur_tag AS financeur_tag,
                   faft.montant_ttc,
                   faft.id
            FROM financeur_tag ft
            JOIN fiche_action_financeur_tag faft ON ft.id = faft.financeur_tag_id
            WHERE faft.fiche_id = fa.id
            ) fin
       ) AS financeurs,
       fic.fiches_liees,
       fa.restreint
FROM fiche_action fa
LEFT JOIN (
          SELECT fath.fiche_id,
                 array_agg(th.*) AS thematiques
          FROM thematique th
          JOIN fiche_action_thematique fath ON fath.thematique_id = th.id
          GROUP BY fath.fiche_id
          ) t ON t.fiche_id = fa.id
LEFT JOIN (
          SELECT fasth.fiche_id,
                 array_agg(sth.*) AS sous_thematiques
          FROM sous_thematique sth
          JOIN fiche_action_sous_thematique fasth ON fasth.thematique_id = sth.id
          GROUP BY fasth.fiche_id
          ) st ON st.fiche_id = fa.id
LEFT JOIN (
          SELECT fapt.fiche_id,
                 array_agg(pt.*) AS partenaires
          FROM partenaire_tag pt
          JOIN fiche_action_partenaire_tag fapt ON fapt.partenaire_tag_id = pt.id
          GROUP BY fapt.fiche_id
          ) p ON p.fiche_id = fa.id
LEFT JOIN (
          SELECT fast.fiche_id,
                 array_agg(st_1.*) AS structures
          FROM structure_tag st_1
          JOIN fiche_action_structure_tag fast ON fast.structure_tag_id = st_1.id
          GROUP BY fast.fiche_id
          ) s ON s.fiche_id = fa.id
LEFT JOIN (
          SELECT fapa.fiche_id,
                 array_agg(pa.*) AS axes
          FROM axe pa
          JOIN fiche_action_axe fapa ON fapa.axe_id = pa.id
          GROUP BY fapa.fiche_id
          ) pla ON pla.fiche_id = fa.id
LEFT JOIN (
          SELECT faa.fiche_id,
                 array_agg(ar.*) AS actions
          FROM action_relation ar
          JOIN fiche_action_action faa ON faa.action_id::text = ar.id::text
          GROUP BY faa.fiche_id
          ) act ON act.fiche_id = fa.id
LEFT JOIN (
          SELECT fast.fiche_id,
                 array_agg(st_1.*) AS services
          FROM service_tag st_1
          JOIN fiche_action_service_tag fast ON fast.service_tag_id = st_1.id
          GROUP BY fast.fiche_id
          ) ser ON ser.fiche_id = fa.id
LEFT JOIN (
          SELECT falt.fiche_id,
                 array_agg(lt_1.*) AS libres_tag
          FROM libre_tag lt_1
          JOIN fiche_action_libre_tag falt ON falt.libre_tag_id = lt_1.id
          GROUP BY falt.fiche_id
          ) lib ON lib.fiche_id = fa.id
LEFT JOIN (
          SELECT falpf.fiche_id,
                 array_agg(fr.*) AS fiches_liees
          FROM private.fiche_resume fr
          JOIN fiches_liees_par_fiche falpf ON falpf.fiche_liee_id = fr.id
          GROUP BY falpf.fiche_id
          ) fic ON fic.fiche_id = fa.id
LEFT JOIN (
          SELECT faea.fiche_id,
                 array_agg(ea.*) AS resultats_attendus
          FROM effet_attendu ea
          JOIN fiche_action_effet_attendu faea ON ea.id = faea.effet_attendu_id
          GROUP BY faea.fiche_id
          ) eff ON eff.fiche_id = fa.id
LEFT JOIN action_impact_temps_de_mise_en_oeuvre tmo
          ON tmo.niveau = fa.temps_de_mise_en_oeuvre_id
LEFT JOIN dcp created_user
          ON created_user.user_id = fa.created_by
LEFT JOIN dcp modified_user
          ON modified_user.user_id = fa.modified_by
;


-- AFTER. Recreate the related views and functions
create or replace view public.fiches_action as
SELECT *
FROM private.fiches_action
WHERE CASE
        WHEN fiches_action.restreint = true THEN have_lecture_acces(fiches_action.collectivite_id) OR est_support()
        ELSE can_read_acces_restreint(fiches_action.collectivite_id)
      END;

CREATE OR REPLACE FUNCTION public.plan_action_export(id integer)
 RETURNS SETOF fiche_action_export
 LANGUAGE sql
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

CREATE OR REPLACE TRIGGER upsert
    INSTEAD OF INSERT OR UPDATE
    ON public.fiches_action
    FOR EACH ROW
    EXECUTE FUNCTION public.upsert_fiche_action();

CREATE OR REPLACE FUNCTION historique.save_fiche_action()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    updated integer;
    id_fiche integer;
    previous_fiche integer;
begin
    id_fiche = coalesce(new.id, old.id);
    update historique.fiche_action
    set
        titre = new.titre,
        description = new.description,
        piliers_eci = new.piliers_eci::text[],
        objectifs = new.objectifs,
        resultats_attendus = new.resultats_attendus::text[],
        cibles = new.cibles::text[],
        ressources = new.ressources,
        financements = new.financements,
        budget_previsionnel = new.budget_previsionnel,
        statut = new.statut::text,
        niveau_priorite = new.niveau_priorite::text,
        date_debut = new.date_debut,
        date_fin_provisoire = new.date_fin_provisoire,
        amelioration_continue = new.amelioration_continue,
        calendrier = new.calendrier,
        maj_termine = new.maj_termine,
        modified_at = new.modified_at,
        modified_by = new.modified_by,
        restreint = new.restreint,
        deleted = new is null
    where id in (select id
                 from historique.fiche_action
                 where fiche_id = id_fiche
                   and modified_at > new.modified_at - interval '1 hour'
                 order by modified_by desc
                 limit 1)
    returning id into updated;

    if updated is null
    then
        insert into historique.fiche_action
        values (default,
                id_fiche,
                new.titre,
                old.titre,
                new.description,
                old.description,
                new.piliers_eci::text[],
                old.piliers_eci::text[],
                new.objectifs,
                old.objectifs,
                new.resultats_attendus::text[],
                old.resultats_attendus::text[],
                new.cibles::text[],
                old.cibles::text[],
                new.ressources,
                old.ressources,
                new.financements,
                old.financements,
                new.budget_previsionnel,
                old.budget_previsionnel,
                new.statut::text,
                old.statut::text,
                new.niveau_priorite::text,
                old.niveau_priorite::text,
                new.date_debut,
                old.date_debut,
                new.date_fin_provisoire,
                old.date_fin_provisoire,
                new.amelioration_continue,
                old.amelioration_continue,
                new.calendrier,
                old.calendrier,
                new.maj_termine,
                old.maj_termine,
                new.collectivite_id,
                new.created_at,
                new.modified_at,
                old.modified_at,
                auth.uid(),
                old.modified_by,
                new.restreint,
                old.restreint,
                new is null)
        returning id into updated;

        select id
        from historique.fiche_action faa
        where fiche_id = id_fiche
        and id <> updated
        order by faa.modified_at desc
        limit 1 into previous_fiche;

        if previous_fiche is not null then
            insert into historique.fiche_action_pilote (fiche_historise_id, user_id, tag_nom, previous)
            select updated, fap.user_id, fap.tag_nom, true
            from historique.fiche_action_pilote fap
            where fap.fiche_historise_id = previous_fiche;
        end if;

    else
        delete from historique.fiche_action_pilote where fiche_historise_id = updated and previous = false;
    end if;

    insert into historique.fiche_action_pilote (fiche_historise_id, user_id, tag_nom, previous)
    select updated, fap.user_id, pt.nom, false
    from public.fiche_action_pilote fap
    left join personne_tag pt on fap.tag_id = pt.id
    where fiche_id = id_fiche;

    return new;
end ;
$function$
;

CREATE OR REPLACE TRIGGER save_history
    AFTER INSERT OR DELETE OR UPDATE
    ON public.fiche_action
    FOR EACH ROW
    EXECUTE FUNCTION historique.save_fiche_action();

COMMIT;

