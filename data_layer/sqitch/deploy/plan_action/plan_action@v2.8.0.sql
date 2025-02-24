-- Deploy tet:plan_action to pg

BEGIN;

drop function filter_fiches_action;

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
    return query
        select *
        from fiches_action fa
        where fa.collectivite_id = collectivite_id
          and case
                  when axes_id is null then true
                  else fa.id in (with child as (select unnest(array_append(a.descendants, a.axe_id)) as axe_id
                                                from axe_descendants a
                                                where a.descendants && (axes_id::integer[])
                                                   or a.axe_id in (select * from unnest(axes_id::integer[])))
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
$$ language plpgsql;
comment on function filter_fiches_action is
    'Filtre la vue pour le client.';

COMMIT;
