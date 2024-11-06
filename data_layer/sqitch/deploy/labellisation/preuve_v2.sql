-- Deploy tet:labellisation/preuve_v2 to pg

BEGIN;

create or replace view bibliotheque_annexe
            (id, collectivite_id, plan_ids, fiche_id, fichier, lien, commentaire, created_at, created_by,
             created_by_nom) as
WITH plan AS (
             SELECT faa.fiche_id,
                    array_agg(distinct axe.plan) AS ids
             FROM fiche_action_axe faa
             JOIN axe ON faa.axe_id = axe.id
             GROUP BY faa.fiche_id
             )
SELECT a.id,
       a.collectivite_id,
       plan.ids                                   AS plan_ids,
       a.fiche_id,
       fs.snippet                                 AS fichier,
       a.lien,
       a.commentaire,
       a.modified_at                              AS created_at,
       a.modified_by                              AS created_by,
       utilisateur.modified_by_nom(a.modified_by) AS created_by_nom
FROM annexe a
LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = a.fichier_id
LEFT JOIN plan USING (fiche_id)
WHERE can_read_acces_restreint(a.collectivite_id)
  AND (
    fs.snippet is null
        or (fs.snippet ->> 'confidentiel'::text)::boolean is false
        or have_lecture_acces(a.collectivite_id)
        or private.est_auditeur(a.collectivite_id)
    );

COMMIT;
