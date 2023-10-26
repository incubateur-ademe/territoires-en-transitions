-- Deploy tet:plan_action to pg

BEGIN;

create or replace function ajouter_fiche_action_dans_un_axe(fiche_id integer, axe_id integer) returns void
    language plpgsql
as
$$
begin
    if peut_modifier_la_fiche(fiche_id)  or is_service_role()
    then
        insert into fiche_action_axe
        values (ajouter_fiche_action_dans_un_axe.fiche_id, ajouter_fiche_action_dans_un_axe.axe_id);
    else
        perform set_config('response.status', '403', true);
    end if;

end;
$$;

create or replace function enlever_fiche_action_d_un_axe(fiche_id integer, axe_id integer) returns void
    language plpgsql
as
$$
begin
    if peut_modifier_la_fiche(fiche_id) or is_service_role()
    then
        delete
        from fiche_action_axe
        where fiche_action_axe.fiche_id = enlever_fiche_action_d_un_axe.fiche_id
          and fiche_action_axe.axe_id = enlever_fiche_action_d_un_axe.axe_id;
    else
        perform set_config('response.status', '403', true);
    end if;
end;
$$;

COMMIT;
