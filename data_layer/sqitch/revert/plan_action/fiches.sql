-- Deploy tet:plan_action/fiches to pg

BEGIN;

create or replace view private.fiche_resume(plans, titre, id, statut, collectivite_id, pilotes, modified_at) as
select (with recursive chemin as (select axe.id as axe_id,
                                         axe.parent,
                                         axe    as plan
                                  from axe
                                  where axe.parent is null
                                    and axe.collectivite_id = fa.collectivite_id
                                  union all
                                  select a.id as axe_id,
                                         a.parent,
                                         p.plan
                                  from axe a
                                           join chemin p on a.parent = p.axe_id)
        select case when count(*) > 0 then array_agg(plan) end
        from chemin
        where chemin.axe_id in (select faa.axe_id from fiche_action_axe faa where faa.fiche_id = fa.id)) as plans,
       fa.titre,
       fa.id,
       fa.statut,
       fa.collectivite_id,
       (select array_agg(row (pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) as array_agg
        from (select coalesce(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom,
                     pt.collectivite_id,
                     fap.tag_id,
                     fap.user_id
              from fiche_action_pilote fap
                       left join personne_tag pt on fap.tag_id = pt.id
                       left join dcp on fap.user_id = dcp.user_id
              where fap.fiche_id = fa.id) pil)                                                           as pilotes,
       fa.modified_at
from fiche_action fa
group by fa.titre, fa.id, fa.statut, fa.collectivite_id;

create or replace function fiche_resume(fiche_action_action fiche_action_action) returns SETOF fiche_resume
    rows 1
    language sql
    stable
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
