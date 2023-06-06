-- Deploy tet:plan_action/fiches to pg

BEGIN;

-- fix fiche_resume
drop function filter_fiches_action;
drop function plan_action_export;
drop function if exists fiche_resume;
drop view public.fiches_action;
drop view private.fiches_action;
drop view public.fiche_resume;
drop view private.fiche_resume;

create view private.fiche_resume
as
select case when array_agg(a.*) = '{null}'::axe[] then null else array_agg(a.*) end as plans,
       fa.titre,
       fa.id,
       fa.statut,
       fa.collectivite_id,
       (select array_agg(pil.*::personne)
        from (select coalesce(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom,
                     pt.collectivite_id,
                     fap.tag_id,
                     fap.user_id
              from fiche_action_pilote fap
                       left join personne_tag pt on fap.tag_id = pt.id
                       left join dcp on fap.user_id = dcp.user_id
              where fap.fiche_id = fa.id) pil)                                      as pilotes,
       fa.modified_at
from fiche_action fa
         left join fiche_action_axe faa on fa.id = faa.fiche_id
         left join plan_action_chemin pac on faa.axe_id = pac.axe_id
         left join axe a on pac.plan_id = a.id
group by fa.titre, fa.id, fa.statut, fa.collectivite_id;

create view private.fiches_action as
select fa.*,
       t.thematiques,
       st.sous_thematiques,
       p.partenaires,
       s.structures,
       (select array_agg(pil.*::personne)
        from (select coalesce(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom,
                     pt.collectivite_id,
                     fap.tag_id,
                     fap.user_id
              from fiche_action_pilote fap
                       left join personne_tag pt on fap.tag_id = pt.id
                       left join dcp on fap.user_id = dcp.user_id
              where fap.fiche_id = fa.id) pil)  as pilotes,
       (select array_agg(ref.*::personne)
        from (select coalesce(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom,
                     pt.collectivite_id,
                     far.tag_id,
                     far.user_id
              from fiche_action_referent far
                       left join personne_tag pt on far.tag_id = pt.id
                       left join dcp on far.user_id = dcp.user_id
              where far.fiche_id = fa.id) ref)  as referents,
       pla.axes,
       act.actions,
       (select array_agg(indi.*::indicateur_generique)
        from (select fai.indicateur_id,
                     fai.indicateur_personnalise_id,
                     coalesce(id.nom, ipd.titre)               as nom,
                     coalesce(id.description, ipd.description) as description,
                     coalesce(id.unite, ipd.unite)             as unite
              from fiche_action_indicateur fai
                       left join indicateur_definition id on fai.indicateur_id = id.id
                       left join indicateur_personnalise_definition ipd on fai.indicateur_personnalise_id = ipd.id
              where fai.fiche_id = fa.id) indi) as indicateurs,
       ser.services,
       -- financeurs
       (select array_agg(fin.*::financeur_montant) as financeurs
        from (select ft as financeur_tag,
                     faft.montant_ttc,
                     faft.id
              from financeur_tag ft
                       join fiche_action_financeur_tag faft on ft.id = faft.financeur_tag_id
              where faft.fiche_id = fa.id) fin) as financeurs,
       fic.fiches_liees
from fiche_action fa
         -- thematiques
         left join (select fath.fiche_id, array_agg(th.*::thematique) as thematiques
                    from thematique th
                             join fiche_action_thematique fath on fath.thematique = th.thematique
                    group by fath.fiche_id) as t on t.fiche_id = fa.id
    -- sous-thematiques
         left join (select fasth.fiche_id, array_agg(sth.*::sous_thematique) as sous_thematiques
                    from sous_thematique sth
                             join fiche_action_sous_thematique fasth on fasth.thematique_id = sth.id
                    group by fasth.fiche_id) as st on st.fiche_id = fa.id
    -- partenaires
         left join (select fapt.fiche_id, array_agg(pt.*::partenaire_tag) as partenaires
                    from partenaire_tag pt
                             join fiche_action_partenaire_tag fapt on fapt.partenaire_tag_id = pt.id
                    group by fapt.fiche_id) as p on p.fiche_id = fa.id
    -- structures
         left join (select fast.fiche_id, array_agg(st.*::structure_tag) as structures
                    from structure_tag st
                             join fiche_action_structure_tag fast on fast.structure_tag_id = st.id
                    group by fast.fiche_id) as s on s.fiche_id = fa.id
    -- axes
         left join (select fapa.fiche_id, array_agg(pa.*::axe) as axes
                    from axe pa
                             join fiche_action_axe fapa on fapa.axe_id = pa.id
                    group by fapa.fiche_id) as pla on pla.fiche_id = fa.id
    -- actions
         left join (select faa.fiche_id, array_agg(ar.*::action_relation) as actions
                    from action_relation ar
                             join fiche_action_action faa on faa.action_id = ar.id
                    group by faa.fiche_id) as act on act.fiche_id = fa.id
    -- services
         left join (select fast.fiche_id, array_agg(st.*::service_tag) as services
                    from service_tag st
                             join fiche_action_service_tag fast on fast.service_tag_id = st.id
                    group by fast.fiche_id) as ser on ser.fiche_id = fa.id
    -- fiches liees
         left join (select falpf.fiche_id, array_agg(fr.*) as fiches_liees
                    from private.fiche_resume fr
                             join fiches_liees_par_fiche falpf on falpf.fiche_liee_id = fr.id
                    group by falpf.fiche_id) as fic on fic.fiche_id = fa.id
;

create view fiches_action as
select *
from private.fiches_action
where can_read_acces_restreint(collectivite_id);

create trigger upsert
    instead of insert or update
    on fiches_action
    for each row
execute procedure upsert_fiche_action();

create function
    filter_fiches_action(
    collectivite_id integer,
    axes_id integer[] default null,
    pilotes personne[] default null,
    niveaux_priorite fiche_action_niveaux_priorite[] default null,
    statuts fiche_action_statuts[] default null,
    referents personne[] default null
)
    returns setof fiches_action
as
$$
    # variable_conflict use_variable
begin
    if not can_read_acces_restreint(filter_fiches_action.collectivite_id) then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    end if;

    return query
        select *
        from fiches_action fa
        where fa.collectivite_id = collectivite_id
          and case
                  when axes_id is null then true
                  else fa.id in (with child as (select a.axe_id as axe_id
                                                from axe_descendants a
                                                where a.parents && (axes_id)
                                                   or a.axe_id in (select * from unnest(axes_id)))
                                 select fiche_id
                                 from child
                                          join fiche_action_axe using (axe_id))
            end
          and case
                  when pilotes is null then true
                  else fa.id in
                       (select fap.fiche_id
                        from fiche_action_pilote fap
                        where fap.tag_id in (select (pi::personne).tag_id from unnest(pilotes) pi)
                           or fap.user_id in (select (pi::personne).user_id from unnest(pilotes) pi))
            end
          and case
                  when referents is null then true
                  else fa.id in
                       (select far.fiche_id
                        from fiche_action_referent far
                        where far.tag_id in (select (re::personne).tag_id from unnest(referents) re)
                           or far.user_id in (select (re::personne).user_id from unnest(referents) re))
            end
          and case
                  when niveaux_priorite is null then true
                  else fa.niveau_priorite in (select * from unnest(niveaux_priorite::fiche_action_niveaux_priorite[]))
            end
          and case
                  when statuts is null then true
                  else fa.statut in (select * from unnest(statuts::fiche_action_statuts[]))
            end;
end;
$$ language plpgsql security definer
                    stable;

create view public.fiche_resume as
select *
from private.fiche_resume
where can_read_acces_restreint(collectivite_id);

create function
    plan_action_export(id integer)
    returns setof fiche_action_export
begin
    atomic
    with recursive
        parents as (select axe.id,
                           axe.nom,
                           axe.collectivite_id,
                           0                as depth,
                           array []::text[] as path,
                           '0 ' || nom      as sort_path
                    from axe
                    where parent is null
                      and axe.id = plan_action_export.id
                      and can_read_acces_restreint(axe.collectivite_id)

                    union all

                    select a.id,
                           a.nom,
                           a.collectivite_id,
                           depth + 1,
                           path || p.nom,
                           p.sort_path || ' ' || depth + 1 || ' ' || a.nom
                    from parents p
                             join axe a on a.parent = p.id),
        fiches as (select a.id as axe_id,
                          f    as fiche
                   from parents a
                            join fiche_action_axe faa on a.id = faa.axe_id
                            join fiches_action f on faa.fiche_id = f.id)
    select p.id, p.nom, p.path, to_jsonb(f)
    from parents p
             left join fiches f on p.id = f.axe_id
    order by naturalsort(sort_path);
end;
comment on function plan_action_export is
    'Les fiches ordonnancées pour l''export des plans d''action.';

-- nouvelle fonctionnalité
create function
    fiche_resume(fiche_action_action)
    returns setof fiche_resume
    rows 1
begin
    atomic
    select * from fiche_resume where id = $1.fiche_id;
end;
comment on function fiche_resume is
    'Permet de lier une fiche action à une action.';

COMMIT;
