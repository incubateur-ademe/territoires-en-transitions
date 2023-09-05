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
GROUP BY fa.titre, fa.id, fa.statut, fa.collectivite_id
ORDER BY naturalsort(fa.titre);

create or replace function fiche_resume(fiche_action_action fiche_action_action) returns SETOF fiche_resume
    rows 1
    language sql
    stable
    security definer
begin
    atomic
    select fr.plans,
           fr.titre,
           fr.id,
           fr.statut,
           fr.collectivite_id,
           fr.pilotes,
           fr.modified_at
    from private.fiche_resume as fr
    where fr.id = fiche_action_action.fiche_id
      and can_read_acces_restreint(fr.collectivite_id);
end;

create or replace function fiche_resume(fiche_action_indicateur fiche_action_indicateur) returns SETOF fiche_resume
    rows 1
    language sql
    stable
    security definer
begin
    atomic
    select fr.plans,
           fr.titre,
           fr.id,
           fr.statut,
           fr.collectivite_id,
           fr.pilotes,
           fr.modified_at
    from private.fiche_resume as fr
    where fr.id = fiche_action_indicateur.fiche_id
      and can_read_acces_restreint(fr.collectivite_id);
end;

COMMIT;
