-- Deploy tet:plan_action to pg

BEGIN;

drop function filter_fiches_action;
drop view axe_descendants;

-- Fonction récursive pour afficher un plan d'action et ses axes
create or replace function plan_action_profondeur(id integer, profondeur integer) returns jsonb as
$$
declare
    pa_enfant_id integer; -- Id d'un plan d'action enfant du plan d'action courant
    pa_axe axe; -- Axe courant
    id_loop integer; -- Indice pour parcourir une boucle
    enfants jsonb[]; -- Plans d'actions enfants du plan d'action courant;
    to_return jsonb; -- JSON retournant le plan d'action courant, ses fiches et ses enfants
begin
    select * from axe where axe.id = plan_action_profondeur.id limit 1 into pa_axe;
    id_loop = 1;
    for pa_enfant_id in
        select pa.id
        from axe pa
        where pa.parent = plan_action_profondeur.id
        order by pa.created_at asc
        loop
            enfants[id_loop] = plan_action_profondeur(pa_enfant_id, profondeur +1);
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


-- Fonction récursive pour afficher un plan d'action, ses axes, et ses fiches
create or replace function plan_action(id integer) returns jsonb as
$$
declare
    pa_enfant_id integer; -- Id d'un plan d'action enfant du plan d'action courant
    pa_axe axe; -- Axe courant
    id_loop integer; -- Indice pour parcourir une boucle
    enfants jsonb[]; -- Plans d'actions enfants du plan d'action courant;
    fiches jsonb; -- Fiches actions du plan d'action courant
    to_return jsonb; -- JSON retournant le plan d'action courant, ses fiches et ses enfants
begin
    fiches = to_jsonb((select array_agg(ff.*)
                       from(
                               select * from fiches_action fa
                                                 join fiche_action_axe fapa on fa.id = fapa.fiche_id
                               where fapa.axe_id = plan_action.id
                               order by fa.modified_at desc
                           )ff)) ;
    select * from axe where axe.id = plan_action.id limit 1 into pa_axe;
    id_loop = 1;
    for pa_enfant_id in
        select pa.id
        from axe pa
        where pa.parent = plan_action.id
        order by pa.created_at asc
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

COMMIT;
