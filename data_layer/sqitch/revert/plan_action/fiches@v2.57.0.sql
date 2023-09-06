-- Deploy tet:plan_action/fiches to pg

BEGIN;

create or replace view private.fiche_resume(plans, titre, id, statut, collectivite_id, pilotes, modified_at) as
SELECT CASE
           WHEN array_agg(a.*) = '{NULL}'::axe[] THEN NULL::axe[]
           ELSE array_agg(a.*)
           END                                 AS plans,
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
       fa.modified_at
FROM fiche_action fa
         LEFT JOIN fiche_action_axe faa ON fa.id = faa.fiche_id
         LEFT JOIN plan_action_chemin pac ON faa.axe_id = pac.axe_id
         LEFT JOIN axe a ON pac.plan_id = a.id
GROUP BY fa.titre, fa.id, fa.statut, fa.collectivite_id;

create or replace view fiche_resume(plans, titre, id, statut, collectivite_id, pilotes, modified_at) as
SELECT fiche_resume.plans,
       fiche_resume.titre,
       fiche_resume.id,
       fiche_resume.statut,
       fiche_resume.collectivite_id,
       fiche_resume.pilotes,
       fiche_resume.modified_at
FROM private.fiche_resume
WHERE can_read_acces_restreint(fiche_resume.collectivite_id);

-- Fonction fiche_resume
create or replace function fiche_resume(fiche_action_action fiche_action_action) returns SETOF fiche_resume
    rows 1
    language sql
BEGIN
    ATOMIC
    SELECT fiche_resume.plans,
           fiche_resume.titre,
           fiche_resume.id,
           fiche_resume.statut,
           fiche_resume.collectivite_id,
           fiche_resume.pilotes,
           fiche_resume.modified_at
    FROM fiche_resume
    WHERE (fiche_resume.id = ($1).fiche_id)
      and can_read_acces_restreint(fiche_resume.collectivite_id);
END;

-- Fonction fiche_resume
create or replace function fiche_resume(fiche_action_indicateur fiche_action_indicateur) returns SETOF fiche_resume
    rows 1
    language sql
BEGIN
    ATOMIC
    SELECT fiche_resume.plans,
           fiche_resume.titre,
           fiche_resume.id,
           fiche_resume.statut,
           fiche_resume.collectivite_id,
           fiche_resume.pilotes,
           fiche_resume.modified_at
    FROM fiche_resume
    WHERE (fiche_resume.id = ($1).fiche_id)
      and can_read_acces_restreint(fiche_resume.collectivite_id);
END;

COMMIT;
