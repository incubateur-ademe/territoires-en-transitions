-- Deploy tet:plan_action to pg

BEGIN;
drop function filter_fiches_action;

create function
    filter_fiches_action(
    collectivite_id integer,
    axe_id integer default null,
    pilote_tag_id integer default null,
    pilote_user_id uuid default null,
    niveau_priorite fiche_action_niveaux_priorite default null,
    statut fiche_action_statuts default null,
    referent_tag_id integer default null,
    referent_user_id uuid default null
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
                  when axe_id is null then true
                  else fa.id in (with child as (select unnest(descendants) as axe_id
                                                from axe_descendants a
                                                where axe_id = any (a.descendants)
                                                   or axe_id = a.axe_id)
                                 select fiche_id
                                 from child
                                          join fiche_action_axe using (axe_id))
            end
          and case
                  when pilote_tag_id is null then true
                  else fa.id in
                       (select fap.fiche_id
                        from fiche_action_pilote fap
                                 join personne_tag pt on fap.tag_id = pt.id
                        where pt.id = pilote_tag_id)
            end
          and case
                  when pilote_user_id is null then true
                  else fa.id in
                       (select fap.fiche_id from fiche_action_pilote fap where fap.user_id = pilote_user_id)
            end
          and case
                  when referent_tag_id is null then true
                  else fa.id in
                       (select far.fiche_id
                        from fiche_action_referent far
                                 join personne_tag pt on far.tag_id = pt.id
                        where pt.id = referent_tag_id)
            end
          and case
                  when referent_user_id is null then true
                  else fa.id in
                       (select far.fiche_id from fiche_action_referent far where far.user_id = referent_user_id)
            end
          and case
                  when niveau_priorite is null then true
                  else fa.niveau_priorite = niveau_priorite
            end
          and case
                  when statut is null then true
                  else statut = fa.statut
            end;
end;
$$ language plpgsql;
comment on function filter_fiches_action is
    'Filtre la vue pour le client.';

COMMIT;
