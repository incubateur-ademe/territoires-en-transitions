-- Deploy tet:utilisateur/invitation_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

create or replace function
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
