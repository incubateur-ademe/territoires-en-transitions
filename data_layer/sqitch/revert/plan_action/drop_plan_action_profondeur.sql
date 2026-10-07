-- Revert tet:plan_action/drop_plan_action_profondeur from pg

BEGIN;

create or replace function plan_action_profondeur(id integer, profondeur integer) returns jsonb
    stable
    security definer
    language plpgsql
as
$$
declare
    pa_enfant_id integer; -- Id d'un plan d'action enfant du plan d'action courant
    pa_axe       axe; -- Axe courant
    id_loop      integer; -- Indice pour parcourir une boucle
    enfants      jsonb[]; -- Plans d'actions enfants du plan d'action courant;
    to_return    jsonb; -- JSON retournant le plan d'action courant, ses fiches et ses enfants
begin
    select * from axe where axe.id = plan_action_profondeur.id limit 1 into pa_axe;
    if can_read_acces_restreint(pa_axe.collectivite_id) then
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
    else
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    end if;
end;
$$;

comment on function plan_action_profondeur is
    'Fonction retournant un JSON contenant le plan d''action passé en paramètre,
    et ses plans d''actions enfants de manière récursive';

create or replace view plan_action_profondeur(collectivite_id, id, plan) as
SELECT a.collectivite_id,
       a.id,
       plan_action_profondeur(a.id, 0) AS plan
FROM axe a
WHERE a.parent IS NULL
  and can_read_acces_restreint(a.collectivite_id);

revoke insert, update, delete on plan_action_profondeur from authenticated;
revoke insert, update, delete on plan_action_profondeur from anon;
revoke insert, update, delete on plan_action_profondeur from service_role;

COMMIT;
