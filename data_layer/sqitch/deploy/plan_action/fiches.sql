-- Deploy tet:plan_action/fiches to pg

BEGIN;

drop view private.fiches_action;
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
       fa.notes_complementaires,
       fa.maj_termine,
       fa.collectivite_id,
       fa.created_at,
       fa.modified_by,
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
       SELECT array_agg(ROW (indi.id, indi.groupement_id, indi.collectivite_id, indi.identifiant_referentiel, indi.titre, indi.titre_long, indi.description, indi.unite, indi.borne_min, indi.borne_max, indi.participation_score, indi.sans_valeur_utilisateur, indi.valeur_calcule, indi.modified_at, indi.created_at, indi.modified_by, indi.created_by)::indicateur_definition) AS array_agg
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
          ) eff ON eff.fiche_id = fa.id;

create or replace view public.fiches_action as
SELECT *
FROM private.fiches_action
WHERE CASE
        WHEN fiches_action.restreint = true THEN have_lecture_acces(fiches_action.collectivite_id) OR est_support()
        ELSE can_read_acces_restreint(fiches_action.collectivite_id)
      END;

COMMIT;

