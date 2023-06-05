-- Deploy tet:plan_action/fiches to pg

BEGIN;

create or replace function
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

create or replace view private.fiche_resume as
select case when a.id is null then null else array_agg(a.*) end as plans,
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
              where fap.fiche_id = fa.id) pil)                  as pilotes,
       fa.modified_at
from fiche_action fa
         left join fiche_action_axe faa on fa.id = faa.fiche_id
         left join plan_action_chemin pac on faa.axe_id = pac.axe_id
         left join axe a on pac.plan_id = a.id
group by fa.titre, fa.id, fa.statut, fa.collectivite_id, a.id;

create or replace view public.fiche_resume as
select *
from private.fiche_resume
where can_read_acces_restreint(collectivite_id);

COMMIT;
