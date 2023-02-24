-- Deploy tet:plan_action to pg

BEGIN;
-- Fonction récursive pour afficher un plan d'action, ses axes, et ses fiches
create or replace function plan_action(id integer) returns jsonb as
$$
declare
    pa_enfant_id integer; -- Id d'un plan d'action enfant du plan d'action courant
    pa_axe       axe; -- Axe courant
    id_loop      integer; -- Indice pour parcourir une boucle
    enfants      jsonb[]; -- Plans d'actions enfants du plan d'action courant;
    fiches       jsonb; -- Fiches actions du plan d'action courant
    to_return    jsonb; -- JSON retournant le plan d'action courant, ses fiches et ses enfants
begin
    fiches = to_jsonb((select array_agg(ff.*)
                       from (select *
                             from fiches_action fa
                                      join fiche_action_axe fapa on fa.id = fapa.fiche_id
                             where fapa.axe_id = plan_action.id
                             order by naturalsort(lower(fa.titre))) ff));
    select * from axe where axe.id = plan_action.id limit 1 into pa_axe;
    id_loop = 1;
    for pa_enfant_id in
        select pa.id
        from axe pa
        where pa.parent = plan_action.id
        order by naturalsort(lower(pa.nom))
        loop
            enfants[id_loop] = plan_action(pa_enfant_id);
            id_loop = id_loop + 1;
        end loop;

    to_return = jsonb_build_object('axe', pa_axe,
                                   'fiches', fiches,
                                   'enfants', enfants);
    return to_return;
end;
$$ language plpgsql;
comment on function plan_action is
    'Fonction retournant un JSON contenant le plan d''action passé en paramètre,
    ses fiches et ses plans d''actions enfants de manière récursive';

-- Fonction récursive pour afficher un plan d'action et ses axes
create or replace function plan_action_profondeur(id integer, profondeur integer) returns jsonb as
$$
declare
    pa_enfant_id integer; -- Id d'un plan d'action enfant du plan d'action courant
    pa_axe       axe; -- Axe courant
    id_loop      integer; -- Indice pour parcourir une boucle
    enfants      jsonb[]; -- Plans d'actions enfants du plan d'action courant;
    to_return    jsonb; -- JSON retournant le plan d'action courant, ses fiches et ses enfants
begin
    select * from axe where axe.id = plan_action_profondeur.id limit 1 into pa_axe;
    id_loop = 1;
    for pa_enfant_id in
        select pa.id
        from axe pa
        where pa.parent = plan_action_profondeur.id
        order by naturalsort(lower(pa.nom))
        loop
            enfants[id_loop] = plan_action_profondeur(pa_enfant_id, profondeur + 1);
            id_loop = id_loop + 1;
        end loop;

    to_return = jsonb_build_object('axe', pa_axe,
                                   'profondeur', plan_action_profondeur.profondeur,
                                   'enfants', enfants);
    return to_return;
end;
$$ language plpgsql;
comment on function plan_action_profondeur is
    'Fonction retournant un JSON contenant le plan d''action passé en paramètre,
    et ses plans d''actions enfants de manière récursive';

create view axe_descendants as
with recursive
    parents as (select id,
                       collectivite_id,
                       array []::integer[] as parents,
                       0                   as depth
                from axe
                where parent is null

                union all

                select a.id,
                       a.collectivite_id,
                       parents || a.parent,
                       depth + 1
                from parents
                         join axe a on a.parent = parents.id),
    descendants as (select a.id, array_agg(p.id) as descendants
                    from axe a
                             join parents p on a.id = any (p.parents)
                    group by a.id)
select id as axe_id, descendants, parents, depth
from parents
         left join descendants using (id);
alter view axe_descendants set (security_invoker = on);

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
