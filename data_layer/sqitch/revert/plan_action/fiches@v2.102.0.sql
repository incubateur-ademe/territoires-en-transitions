-- Deploy tet:plan_action/fiches to pg

BEGIN;

drop function filter_fiches_action;
drop function fiche_resume(fiche_action_action fiche_action_action);
drop function fiche_resume(fiche_action_indicateur fiche_action_indicateur);
drop function create_fiche;
drop function plan_action_export;
drop view public.fiche_resume;
drop view public.fiches_action;
drop view private.fiches_action;
drop view private.fiche_resume;

create or replace view private.fiche_resume as
SELECT p.plans,
       fa.titre,
       fa.id,
       fa.statut,
       fa.collectivite_id,
       (SELECT array_agg(ROW (pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) AS array_agg
        FROM (SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                     pt.collectivite_id,
                     fap.tag_id,
                     fap.user_id
              FROM fiche_action_pilote fap
                       LEFT JOIN personne_tag pt ON fap.tag_id = pt.id
                       LEFT JOIN dcp ON fap.user_id = dcp.user_id
              WHERE fap.fiche_id = fa.id) pil) AS pilotes,
       fa.modified_at,
       fa.date_fin_provisoire,
       fa.niveau_priorite,
       fa.restreint
FROM fiche_action fa
         LEFT JOIN (SELECT faa.fiche_id,
                           array_agg(DISTINCT plan.*) AS plans
                    FROM fiche_action_axe faa
                             JOIN axe ON faa.axe_id = axe.id
                             JOIN axe plan ON axe.plan = plan.id
                    GROUP BY faa.fiche_id) p ON p.fiche_id = fa.id
GROUP BY fa.titre, fa.id, fa.statut, fa.collectivite_id, p.plans
ORDER BY (naturalsort(fa.titre::text));

create or replace view fiche_resume as
SELECT fr.plans,
       fr.titre,
       fr.id,
       fr.statut,
       fr.collectivite_id,
       fr.pilotes,
       fr.modified_at,
       fr.date_fin_provisoire,
       fr.niveau_priorite,
       fr.restreint
FROM private.fiche_resume fr
WHERE can_read_acces_restreint(fr.collectivite_id);

create or replace function
    create_fiche(
    collectivite_id int,
    axe_id int default null,
    action_id action_id default null,
    indicateur_referentiel_id indicateur_id default null,
    indicateur_personnalise_id int default null
)
    returns fiche_resume
    language plpgsql
    volatile
as
$$
declare
    new_fiche_id int;
    resume       fiche_resume;
begin
    if not have_edition_acces(create_fiche.collectivite_id) and not is_service_role()
    then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    insert into fiche_action (collectivite_id, titre)
    values (create_fiche.collectivite_id, '')
    returning id into new_fiche_id;

    if create_fiche.axe_id is not null
    then
        insert into fiche_action_axe (fiche_id, axe_id)
        values (new_fiche_id, create_fiche.axe_id);
    end if;

    if create_fiche.action_id is not null
    then
        insert into fiche_action_action (fiche_id, action_id)
        values (new_fiche_id, create_fiche.action_id);
    end if;

    if create_fiche.indicateur_referentiel_id is not null
    then
        insert into fiche_action_indicateur (fiche_id, indicateur_id)
        values (new_fiche_id, create_fiche.indicateur_referentiel_id);
    end if;

    if create_fiche.indicateur_personnalise_id is not null
    then
        insert into fiche_action_indicateur (fiche_id, indicateur_personnalise_id)
        values (new_fiche_id, create_fiche.indicateur_personnalise_id);
    end if;

    select * from fiche_resume where id = new_fiche_id limit 1 into resume;
    return resume;
end;
$$;

create function fiche_resume(fiche_action_action fiche_action_action) returns SETOF fiche_resume
    stable
    security definer
    rows 1
    language sql
BEGIN ATOMIC
SELECT fr.plans,
       fr.titre,
       fr.id,
       fr.statut,
       fr.collectivite_id,
       fr.pilotes,
       fr.modified_at,
       fr.date_fin_provisoire,
       fr.niveau_priorite,
       fr.restreint
FROM private.fiche_resume fr
WHERE ((fr.id = (fiche_resume.fiche_action_action).fiche_id) AND can_read_acces_restreint(fr.collectivite_id));
END;

create function fiche_resume(fiche_action_indicateur fiche_action_indicateur) returns SETOF fiche_resume
    stable
    security definer
    rows 1
    language sql
BEGIN ATOMIC
SELECT fr.plans,
       fr.titre,
       fr.id,
       fr.statut,
       fr.collectivite_id,
       fr.pilotes,
       fr.modified_at,
       fr.date_fin_provisoire,
       fr.niveau_priorite,
       fr.restreint
FROM private.fiche_resume fr
WHERE ((fr.id = (fiche_resume.fiche_action_indicateur).fiche_id) AND can_read_acces_restreint(fr.collectivite_id));
END;

create function filter_fiches_action(collectivite_id integer, sans_plan boolean DEFAULT false, axes_id integer[] DEFAULT NULL::integer[], sans_pilote boolean DEFAULT false, pilotes personne[] DEFAULT NULL::personne[], sans_referent boolean DEFAULT false, referents personne[] DEFAULT NULL::personne[], sans_niveau boolean DEFAULT false, niveaux_priorite fiche_action_niveaux_priorite[] DEFAULT NULL::fiche_action_niveaux_priorite[], sans_statut boolean DEFAULT false, statuts fiche_action_statuts[] DEFAULT NULL::fiche_action_statuts[], sans_budget boolean DEFAULT false, budget_min integer DEFAULT NULL::integer, budget_max integer DEFAULT NULL::integer, sans_date boolean DEFAULT false, date_debut timestamp with time zone DEFAULT NULL::timestamp with time zone, date_fin timestamp with time zone DEFAULT NULL::timestamp with time zone, echeance fiche_action_echeances DEFAULT NULL::fiche_action_echeances, "limit" integer DEFAULT 10) returns SETOF fiche_resume
    stable
    security definer
    language plpgsql
as
$$
    # variable_conflict use_variable
begin
    if not can_read_acces_restreint(filter_fiches_action.collectivite_id) then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    end if;

    return query
        select fr.*
        from fiche_resume fr
                 join fiche_action fa on fr.id = fa.id
        where fr.collectivite_id = filter_fiches_action.collectivite_id
          and case -- axes_id
                  when sans_plan then
                      fr.id not in (select distinct fiche_id from fiche_action_axe)
                  when axes_id is null then true
                  else fr.id in (with child as (select a.axe_id as axe_id
                                                from axe_descendants a
                                                where a.parents && (axes_id)
                                                   or a.axe_id in (select * from unnest(axes_id)))
                                 select fiche_id
                                 from child
                                          join fiche_action_axe using (axe_id))
            end
          and case -- pilotes
                  when sans_pilote then
                      fr.id not in (select distinct fiche_id from fiche_action_pilote)
                  when pilotes is null then true
                  else fr.id in
                       (select fap.fiche_id
                        from fiche_action_pilote fap
                        where fap.tag_id in (select (pi::personne).tag_id from unnest(pilotes) pi)
                           or fap.user_id in (select (pi::personne).user_id from unnest(pilotes) pi))
            end
          and case -- referents
                  when sans_referent then
                      fr.id not in (select distinct fiche_id from fiche_action_referent)
                  when referents is null then true
                  else fr.id in
                       (select far.fiche_id
                        from fiche_action_referent far
                        where far.tag_id in (select (re::personne).tag_id from unnest(referents) re)
                           or far.user_id in (select (re::personne).user_id from unnest(referents) re))
            end
          and case -- niveaux_priorite
                  when sans_niveau then fa.niveau_priorite is null
                  when niveaux_priorite is null then true
                  else fa.niveau_priorite in (select * from unnest(niveaux_priorite::fiche_action_niveaux_priorite[]))
            end
          and case -- statuts
                  when sans_statut then fa.statut is null
                  when statuts is null then true
                  else fr.statut in (select * from unnest(statuts::fiche_action_statuts[]))
            end
          and case -- budget_min
                  when sans_budget then fa.budget_previsionnel is null
                  when budget_min is null then true
                  when fa.budget_previsionnel is null then false
                  else fa.budget_previsionnel >= budget_min
            end
          and case -- budget_max
                  when sans_budget then fa.budget_previsionnel is null
                  when budget_max is null then true
                  when fa.budget_previsionnel is null then false
                  else fa.budget_previsionnel <= budget_max
            end
          and case -- date_debut
                  when sans_date then fa.date_debut is null
                  when filter_fiches_action.date_debut is null then true
                  when fa.date_debut is null then false
                  else fa.date_debut <= filter_fiches_action.date_debut
            end
          and case -- date_fin
                  when sans_date then fa.date_fin_provisoire is null
                  when date_fin is null then true
                  when fa.date_fin_provisoire is null then false
                  else fa.date_fin_provisoire <= date_fin
            end
          and case -- echeances
                  when echeance is null then true
                  when echeance = 'Action en amélioration continue'
                      then fa.amelioration_continue
                  when echeance = 'Sans échéance'
                      then fa.date_fin_provisoire is null
                  when echeance = 'Échéance dépassée'
                      then fa.date_fin_provisoire > now()
                  when echeance = 'Échéance dans moins de trois mois'
                      then fa.date_fin_provisoire < (now() + interval '3 months')
                  when echeance = 'Échéance entre trois mois et 1 an'
                      then fa.date_fin_provisoire >= (now() + interval '3 months')
                      and fa.date_fin_provisoire < (now() + interval '1 year')
                  when echeance = 'Échéance dans plus d’un an'
                      then fa.date_fin_provisoire > (now() + interval '1 year')
                  else false
            end
        order by naturalsort(fr.titre)
        limit filter_fiches_action."limit";
end;
$$;

create view private.fiches_action
as
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
       (SELECT array_agg(ROW (indi.indicateur_id, indi.indicateur_personnalise_id, indi.nom, indi.description, indi.unite)::indicateur_generique) AS array_agg
        FROM (SELECT fai.indicateur_id,
                     fai.indicateur_personnalise_id,
                     COALESCE(id.nom, ipd.titre)               AS nom,
                     COALESCE(id.description, ipd.description) AS description,
                     COALESCE(id.unite, ipd.unite)             AS unite
              FROM fiche_action_indicateur fai
                       LEFT JOIN indicateur_definition id ON fai.indicateur_id::text = id.id::text
                       LEFT JOIN indicateur_personnalise_definition ipd ON fai.indicateur_personnalise_id = ipd.id
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




create view fiches_action as
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

create function plan_action_export(id integer) returns SETOF fiche_action_export
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
