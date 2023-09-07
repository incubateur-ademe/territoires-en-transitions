-- Deploy tet:plan_action/export to pg

BEGIN;

drop function plan_action_export;
drop type fiche_action_export;

create or replace function plan_action_export(id integer) returns jsonb as
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
                             from private.fiches_action fa
                                      join fiche_action_axe fapa on fa.id = fapa.fiche_id
                             where fapa.axe_id = plan_action_export.id
                             order by naturalsort(lower(fa.titre))) ff));
    select * from axe where axe.id = plan_action_export.id limit 1 into pa_axe;
    if not can_read_acces_restreint(pa_axe.collectivite_id) then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    end if;
    id_loop = 1;
    for pa_enfant_id in
        select pa.id
        from axe pa
        where pa.parent = plan_action_export.id
        order by naturalsort(lower(pa.nom))
        loop
            enfants[id_loop] = plan_action_export(pa_enfant_id);
            id_loop = id_loop + 1;
        end loop;

    to_return = jsonb_build_object('axe', pa_axe,
                                   'fiches', fiches,
                                   'enfants', enfants);
    return to_return;
end;
$$ language plpgsql security definer
                    stable;

COMMIT;
