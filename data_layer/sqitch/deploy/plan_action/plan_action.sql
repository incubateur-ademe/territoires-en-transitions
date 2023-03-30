-- Deploy tet:plan_action to pg

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
$$ language plpgsql security definer
                    stable;
comment on function filter_fiches_action is
    'Filtre la vue pour le client.';

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
    if not can_read_acces_restreint(pa_axe.collectivite_id) then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    end if;
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
$$ language plpgsql security definer
                    stable;
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
    if not can_read_acces_restreint(pa_axe.collectivite_id) then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    end if;
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
$$ language plpgsql security definer
                    stable;
comment on function plan_action_profondeur is
    'Fonction retournant un JSON contenant le plan d''action passé en paramètre,
    et ses plans d''actions enfants de manière récursive';

COMMIT;
