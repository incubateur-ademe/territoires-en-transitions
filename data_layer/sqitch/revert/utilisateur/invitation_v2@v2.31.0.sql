-- Revert tet:utilisateur/invitation_v2 from pg

BEGIN;

drop function consume_invitation(id uuid);
drop function add_user(collectivite_id integer, email text, niveau niveau_acces);
drop function utilisateur.invite(collectivite_id integer, email text, niveau niveau_acces);
drop function utilisateur.associate(collectivite_id integer, user_id uuid, niveau niveau_acces, invitation_id uuid);
alter table private_utilisateur_droit drop constraint unique_user_collectivite;
alter table private_utilisateur_droit drop column invitation_id;
drop table utilisateur.invitation;


-- replay invitation v1
create table private_collectivite_invitation
(
    id              uuid primary key         default gen_random_uuid(),
    role_name       role_name                                          not null,
    collectivite_id integer references collectivite                    not null,
    created_by      uuid references auth.users                         not null,
    created_at      timestamp with time zone default CURRENT_TIMESTAMP not null
);
alter table private_collectivite_invitation
    enable row level security;
create policy allow_read
    on private_collectivite_invitation
    for select
    using (is_any_role_on(collectivite_id));
create policy allow_insert
    on private_collectivite_invitation
    for insert
    with check (is_referent_of(collectivite_id));


create or replace function create_agent_invitation(collectivite_id integer)
    returns json
as
$$
declare
    invitation_id uuid;
begin
    if is_referent_of(create_agent_invitation.collectivite_id)
    then
        select gen_random_uuid() into invitation_id;
        insert into private_collectivite_invitation
        values (invitation_id, 'agent', create_agent_invitation.collectivite_id, auth.uid());
        return json_build_object('message', 'L''invitation a été crée.', 'id', invitation_id);
    else
        perform set_config('response.status', '401', true);
        return json_build_object('error', 'Vous n''êtes pas le référent de cette collectivité.');
    end if;
end
$$ language plpgsql security definer;

create function latest_invitation(collectivite_id integer)
    returns json
as
$$
declare
    param_collectivite_id integer;
    invitation_id         uuid;
begin
    select collectivite_id into param_collectivite_id;
    if is_any_role_on(collectivite_id)
    then
        select into invitation_id id
        from private_collectivite_invitation
        where private_collectivite_invitation.collectivite_id = param_collectivite_id;
        return json_build_object('id', invitation_id);
    else
        perform set_config('response.status', '401', true);
        return json_build_object('error', 'Vous n''avez pas rejoint cette collectivité.');
    end if;
end;
$$ language plpgsql;

create or replace function accept_invitation(invitation_id uuid)
    returns json
as
$$
declare
    invitation_collectivite_id integer;
begin
    select into invitation_collectivite_id collectivite_id
    from private_collectivite_invitation
    where id = invitation_id;
    if (is_any_role_on(invitation_collectivite_id))
    then
        perform set_config('response.status', '401', true);
        return json_build_object('error', 'Vous avez déjà rejoint cette collectivité.');
    else
        insert into private_utilisateur_droit(user_id, collectivite_id, role_name, active)
        select auth.uid(), collectivite_id, role_name, true
        from private_collectivite_invitation
        where id = invitation_id
        order by created_at
        limit 1;
        return json_build_object('message', 'Vous avez rejoint cette collectivité.');
    end if;
end
$$ language plpgsql security definer;

COMMIT;
