-- Deploy tet:utilisateur/invitation_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

-- Drop deprecated invitation flow.
drop function create_agent_invitation;
drop function latest_invitation;
drop function accept_invitation;
truncate table private_collectivite_invitation;
drop table private_collectivite_invitation;


-- Create the invitation table in utilisateur schema.
create table utilisateur.invitation
(
    id              uuid primary key default gen_random_uuid(),
    niveau          niveau_acces                               not null,
    email           text                                       not null,
    collectivite_id integer references collectivite            not null,

    created_by      uuid references auth.users                 not null,
    created_at      timestamptz      default CURRENT_TIMESTAMP not null,

    accepted_at     timestamptz,
    consumed        bool generated always as (accepted_at is not null) stored,
    pending         bool generated always as (accepted_at is null and active) stored,
    active          bool             default true
);
comment on table utilisateur.invitation is
    'Permet d''inviter un utilisateur sur une collectivité.';

-- Add a reference to invitation in private_utilisateur_droit.
alter table private_utilisateur_droit
    add invitation_id uuid references utilisateur.invitation;
comment on column private_utilisateur_droit.invitation_id is
    'L''id de l''invitation utilisée pour obtenir ce droit.';

-- Invitation RLS
alter table utilisateur.invitation
    enable row level security;

create policy allow_read -- so we expose the data in views for admin purposes.
    on utilisateur.invitation
    using (true);


-- Add a new constraint on droits.
alter table private_utilisateur_droit
    add constraint unique_user_collectivite unique (user_id, collectivite_id);
comment on constraint unique_user_collectivite on private_utilisateur_droit is
    'Un utilisateur ne peut avoir qu''un seul droit par collectivité.';

-- Internal functions.
create function
    utilisateur.associate(
    collectivite_id integer,
    user_id uuid,
    niveau niveau_acces,
    invitation_id uuid
)
    returns void
as
$$
insert into private_utilisateur_droit (user_id, collectivite_id, active, niveau_acces, invitation_id)
values (associate.user_id, associate.collectivite_id, true, associate.niveau, associate.invitation_id)
on conflict (user_id, collectivite_id)
    do update set active        = true,
                  niveau_acces  = associate.niveau,
                  invitation_id = associate.invitation_id;
$$ language sql;
comment on function utilisateur.associate is
    'Associe un utilisateur à une collectivité avec un niveau d''accès.';


create function
    utilisateur.invite(
    collectivite_id integer,
    email text,
    niveau niveau_acces
)
    returns uuid
as
$$
insert into utilisateur.invitation (niveau, email, collectivite_id, created_by)
values (invite.niveau, invite.email, invite.collectivite_id, auth.uid())
returning id;
$$ language sql;
comment on function utilisateur.invite is
    'Crée une invitation et renvoie son id.';


-- API exposed RPCs.
create function add_user(
    collectivite_id integer,
    email text,
    niveau niveau_acces
) returns json
as
$$
declare
    existing_user    auth.users;
    conflicting_user bool;
    invitation_id    uuid;
begin
    if have_edition_acces(collectivite_id) or is_service_role()
    then
        select *
        from auth.users u
        where u.email = add_user.email
        into existing_user;

        if FOUND
        then
            -- There is an existing user matching the email.
            select count(*) > 0
            from private_utilisateur_droit pud
            where add_user.collectivite_id = pud.collectivite_id
              and existing_user.id = pud.user_id
            into conflicting_user;

            if conflicting_user
            then
                if (select count(*) > 0
                    from private_utilisateur_droit pud
                    where add_user.collectivite_id = pud.collectivite_id
                      and existing_user.id = pud.user_id
                      and active = true)
                then
                    -- The existing user is already associated with our collectivite.
                    perform set_config('response.status', '409', true); -- 409: Conflict
                    return json_build_object(
                            'error', 'L''utilisateur est déjà associé à cette collectivité.'
                        );
                else
                    -- The existing user's rights to the collectivite had been desactivated.
                    update private_utilisateur_droit
                    set active      = true,
                        modified_at = now(),
                        niveau_acces=add_user.niveau
                    where user_id = existing_user.id
                      and private_utilisateur_droit.collectivite_id = add_user.collectivite_id;

                    return json_build_object(
                            'added', true,
                            'message', 'Accès de l''utilisateur ré-activés.'
                        );
                end if;
            else
                -- Associate the existing user with our collectivite.
                perform utilisateur.associate(
                        add_user.collectivite_id,
                        existing_user.id,
                        add_user.niveau,
                        null
                    );
                return json_build_object(
                        'added', true,
                        'message', 'Utilisateur ajouté.'
                    );
            end if;

        else
            -- No user matching the email was found, we should invite them.
            select utilisateur.invite(
                           add_user.collectivite_id,
                           add_user.email,
                           add_user.niveau
                       )
            into invitation_id;
            return json_build_object(
                    'invitation_id', invitation_id,
                    'message', 'Invitation créée.'
                );
        end if;
    else
        -- Not admin nor service role.
        perform set_config('response.status', '403', true); -- 403: Forbidden
        return json_build_object('error', 'Vous n''êtes pas administrateur de cette collectivité.');
    end if;
end;
$$ language plpgsql security definer;
comment on function add_user is
    'Ajoute un utilisateur à une collectivité avec un niveau d''accès.
        Si l''utilisateur
        - est déjà associé à la collectivité renvoie une erreur 409.
        - est dans la base, renvoie un message json {"added": true}.
        - n''est pas dans la base, renvoie un message json { "invitation_id": uuid }.';


create function
    consume_invitation(id uuid)
    returns void
as
$$
declare
    invitation utilisateur.invitation;
begin
    if is_authenticated()
    then
        -- The current user is authenticated.
        select *
        from utilisateur.invitation i
        where i.id = consume_invitation.id
        into invitation;

        if invitation.pending
        then
            -- The invitation is still pending (hasn't been consumed).
            -- Mark the invitation as consumed.
            update utilisateur.invitation i
            set accepted_at = now()
            where i.id = invitation.id;

            -- Associate the user to the collectivité.
            perform utilisateur.associate(
                    invitation.collectivite_id,
                    auth.uid(),
                    invitation.niveau,
                    invitation.id
                );

            perform set_config('response.status', '201', true); -- 201: Created
        else
            -- The invitation is consumed.
            perform set_config('response.status', '403', true); -- 403: Forbidden
        end if;
    else
        -- Not authenticated.
        perform set_config('response.status', '401', true); -- 401: Unauthorized
    end if;
end;
$$ language plpgsql security definer;
comment on function consume_invitation is
    'Permet à l''utilisateur d''utiliser une invitation pour rejoindre une collectivité.'
        ' Renvoie un code 201 en cas de succès.'
        ' L''invitation n''est plus utilisable par la suite.';

COMMIT;
