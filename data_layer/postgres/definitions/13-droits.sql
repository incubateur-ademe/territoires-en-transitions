--------------------------------
----------- TABLES -------------
--------------------------------
create type role_name as enum ('agent', 'referent', 'conseiller', 'auditeur', 'aucun');

create table private_utilisateur_droit
(
    id              serial primary key,
    user_id         uuid references auth.users                         not null,
    collectivite_id integer references collectivite                    not null,
    role_name       role_name                                          not null,
    active          bool                                               not null,
    created_at      timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at     timestamp with time zone default CURRENT_TIMESTAMP not null
);

alter table private_utilisateur_droit
    enable row level security;

create policy allow_read
    on private_utilisateur_droit
    for select
    using (true);

--------------------------------
-------- RLS HELPERS -----------
--------------------------------
create or replace function
    is_any_role_on(id integer)
    returns boolean
as
$$
select count(*) > 0
from private_utilisateur_droit
where private_utilisateur_droit.collectivite_id = is_any_role_on.id
  and private_utilisateur_droit.user_id = auth.uid()
  and active
$$ language sql;
comment on function is_any_role_on is
    'Returns true if current user have a any role on a collectivité id';


create or replace function
    is_amongst_role_on(role_list role_name[], id integer)
    returns boolean
as
$$
select count(*) > 0
from private_utilisateur_droit
where private_utilisateur_droit.collectivite_id = is_amongst_role_on.id
  and role_name = any (is_amongst_role_on.role_list)
  and private_utilisateur_droit.user_id = auth.uid()
  and active
$$ language sql;
comment on function is_amongst_role_on is
    'Returns true if current user is amongst role list on a collectivité id';


create or replace function
    is_role_on(role role_name, id integer)
    returns boolean
as
$$
select count(*) > 0
from private_utilisateur_droit
where private_utilisateur_droit.collectivite_id = is_role_on.id
  and private_utilisateur_droit.user_id = auth.uid()
  and role_name = is_role_on.role
  and active
$$ language sql;
comment on function is_role_on is
    'Returns true if current user have a given role on a collectivité id';

create or replace function
    is_referent_of(id integer)
    returns boolean
as
$$
select is_role_on('referent', is_referent_of.id)
$$ language sql;
comment on function is_referent_of is
    'Returns true if current user is a referent of collectivite id';

create or replace function
    is_agent_of(id integer)
    returns boolean
as
$$
select is_role_on('agent', is_agent_of.id)
$$ language sql;
comment on function is_agent_of is
    'Returns true if current user is a agent of collectivite id';

create or replace function
    is_authenticated()
    returns boolean
as
$$
begin
    return auth.role() = 'authenticated';
end;
$$ language plpgsql;
comment on function is_authenticated is
    'Returns true if current user is authenticated.';


--------------------------------
------------ VIEWS -------------
--------------------------------
create or replace view active_collectivite as
select named_collectivite.collectivite_id, nom
from named_collectivite
         join private_utilisateur_droit
              on named_collectivite.collectivite_id = private_utilisateur_droit.collectivite_id
where private_utilisateur_droit.id is not null
  and private_utilisateur_droit.active
  and is_authenticated()
group by named_collectivite.collectivite_id, nom
order by nom;

create view owned_collectivite
as
with current_droits as (
    select *
    from private_utilisateur_droit
    where user_id = auth.uid()
      and active
)
select named_collectivite.collectivite_id as collectivite_id, named_collectivite.nom, role_name
from current_droits
         join named_collectivite on named_collectivite.collectivite_id = current_droits.collectivite_id
         join epci on named_collectivite.collectivite_id = epci.collectivite_id
order by nom;


create or replace view elses_collectivite
as
select active_collectivite.collectivite_id, active_collectivite.nom
from active_collectivite
         full outer join owned_collectivite on
        owned_collectivite.collectivite_id = active_collectivite.collectivite_id
where auth.uid() is null -- return all active collectivités if auth.user is null
   or owned_collectivite.collectivite_id is null;
comment on view elses_collectivite is 'Collectivités not belonging to the authenticated user';


--------------------------------
------- OWNERSHIP RPCs ---------
--------------------------------
create or replace function claim_collectivite(id integer) returns json
as
$$
declare
    collectivite_already_claimed bool;
    claimed_collectivite_id      integer;
begin
    select id into claimed_collectivite_id;

    -- compute collectivite_already_claimed, which is true if a droit exist for claimed collectivite
    select is_referent_of(claimed_collectivite_id)
    into collectivite_already_claimed;

    if not collectivite_already_claimed
    then
        -- current user can claim collectivite as its own
        -- create a droit for current user on collectivite
        delete
        from private_utilisateur_droit
        where is_referent_of(claimed_collectivite_id);
        insert
        into private_utilisateur_droit(user_id, collectivite_id, role_name, active)
        values (auth.uid(), claimed_collectivite_id, 'referent', true);
        -- return a success message
        perform set_config('response.status', '200', true);
        return json_build_object('message', 'Vous êtes référent de la collectivité.');
    else
        -- current user cannot claim the collectivite
        -- return an error with a reason
        perform set_config('response.status', '409', true);
        return json_build_object('message', 'La collectivité dispose déjà d''un référent.');
    end if;
end
$$ language plpgsql security definer;
comment on function claim_collectivite is
    'Claims an EPCI : '
        'will succeed with a code 200 if this EPCI does not have referent yet.'
        'If the EPCI was already claimed it will fail with a code 409.';

create or replace function quit_collectivite(id integer) returns json as
$$
declare
    collectivite_already_joined bool;
    joined_collectivite_id      integer;
begin
    select id into joined_collectivite_id;

    -- compute epci_already_joined, which is true if a droit exist for claimed epci
    select count(*) > 0
    from private_utilisateur_droit
    where collectivite_id = joined_collectivite_id
      and role_name = 'referent'
    into collectivite_already_joined;

    if not collectivite_already_joined
    then
        -- current user cannot quit an epci that was not joined.
        -- return an error with a reason
        perform set_config('response.status', '409', true);
        return json_build_object('message', 'Vous n''avez pas pu quitter la collectivité.');
    else
        -- current user quit collectivité
        -- deactivate the droits
        update private_utilisateur_droit
        set active      = false,
            modified_at = now()
        where collectivite_id = joined_collectivite_id;

        -- return success with a message
        perform set_config('response.status', '200', true);
        return json_build_object('message', 'Vous avez quitté la collectivité.');
    end if;
end
$$ language plpgsql security definer;
comment on function quit_collectivite is
    'Unclaims an Collectivité: '
        'Will succeed with a code 200 if user have a droit on this collectivité.'
        'Otherwise it will fail wit a code 40x.';


create or replace function referent_contact(id integer) returns json as
$$
declare
    requested_collectivite_id integer;
    referent_id               uuid;
    referent_email            text;
    referent_nom              text;
    referent_prenom           text;
begin
    -- select the collectivite id to get contact info from using its siren
    select id into requested_collectivite_id;

    -- select referent user id
    select user_id
    from private_utilisateur_droit
    where active
      and collectivite_id = requested_collectivite_id
      and role_name = 'referent'
    into referent_id;

    if referent_id is null
    then
        perform set_config('response.status', '404', true);
        return json_build_object('message', 'Cette collectivité n''a pas de référent.');
    else
        -- retrieve contact information of referent_id
        select email, nom, prenom
        from dcp
        where user_id = referent_id
        into referent_email, referent_nom, referent_prenom;
        perform set_config('response.status', '200', true);
        return json_build_object('email', referent_email, 'nom', referent_nom, 'prenom', referent_prenom);
    end if;
end

$$ language plpgsql security definer;
comment on function referent_contact is
    'Returns the contact information of the Collectivité referent given the siren.';



--------------------------------
------- INVITATION FLOW --------
--------------------------------
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

create function create_agent_invitation(collectivite_id integer)
    returns json
as
$$
declare
    inivitation_id uuid;
begin
    if is_referent_of(create_agent_invitation.collectivite_id)
    then
        select gen_random_uuid() into inivitation_id;
        insert into private_collectivite_invitation
        values (inivitation_id, 'agent', create_agent_invitation.collectivite_id, auth.uid());
        return json_build_object('message', 'L''invitation a été crée.', 'id', inivitation_id);
    else
        perform set_config('response.status', '401', true);
        return json_build_object('message', 'Vous n''êtes par le référent de cette collectivité.');
    end if;
end
$$ language plpgsql;

create function latest_invitation(in collectivite_id integer, out invitation_id uuid)
as
$$
declare
    param_collectivite_id integer;
begin
    select collectivite_id into param_collectivite_id;
    if is_any_role_on(collectivite_id)
    then
        return query
            select id as invitation_id
            from private_collectivite_invitation
            where private_collectivite_invitation.collectivite_id = param_collectivite_id;
    else
        perform set_config('response.status', '401', true);
        return json_build_object('message', 'Vous n''êtes n''avez pas rejoint cette collectivité.');
    end if;
end;
$$ language plpgsql;

create function accept_invitation(invitation_id uuid)
as
$$
insert into private_utilisateur_droit(user_id, collectivite_id, role_name, active)
select auth.uid(), collectivite_id, role_name, true
from private_collectivite_invitation
where id = invitation_id
order by created_at
limit 1
$$ language sql security definer;


create function remove_from_collectivite(user_id uuid, collectivite_id integer)
    returns json
as
$$
declare
    param_user_id         uuid;
    param_collectivite_id integer;
begin
    -- parameters are ambiguous
    select user_id into param_user_id;
    select collectivite_id into param_collectivite_id;

    -- only referents can remove other users.
    if is_referent_of(remove_from_collectivite.collectivite_id)
    then
        -- deactivate the droits
        update private_utilisateur_droit
        set active      = false,
            modified_at = now()
        where collectivite_id = param_collectivite_id
          and user_id = param_user_id;

        -- return success with a message
        perform set_config('response.status', '200', true);
        return json_build_object('message', 'Vous avez retiré les droits à l''utilisateur.');
    else
        perform set_config('response.status', '401', true);
        return json_build_object('message', 'Vous n''êtes par le référent de cette collectivité.');
    end if;
end;
$$ language plpgsql security definer;
