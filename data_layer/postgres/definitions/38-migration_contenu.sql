create or replace function
    private.move_action_data(a action_id, b action_id)
    returns void
as
$$
update action_statut
set action_id = b
where action_id = a;

update action_commentaire
set action_id = b
where action_id = a;

$$ language sql;
comment on function private.move_action_data is
    'Déplace le contenu d''une action vers une autre.';


create or replace function
    private.remove_action_data(a action_id)
    returns void
as
$$
delete from action_statut
where action_id = a;

delete from action_commentaire
where action_id = a;

$$ language sql;
comment on function private.remove_action_data is
    'Supprime le contenu d''une action';
