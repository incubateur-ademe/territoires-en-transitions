-- Deploy tet:utilisateur/invitation_acceptance_token to pg

BEGIN;

-- Les identifiants ont été exposés dans les annuaires : aucun ancien lien
-- ne doit redevenir valide. Chaque invitation reçoit un nouveau jeton.
alter table utilisateur.invitation
    add column acceptance_token uuid not null default gen_random_uuid() unique;

-- L'ancien RPC de création renvoie le jeton dans le champ historique
-- invitation_id pour les appelants qui enchaînent add_user et consume_invitation.
create or replace function
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
returning acceptance_token;
$$ language sql;

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
        where i.acceptance_token = consume_invitation.id
        for update
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

            -- Ajoute le droit vérifié à l'utilisateur invité
            -- On vérifie si l'enregistrement existe déjà
            -- car l'ordre d'exécution entre l'insert dans dcp et consume_invitation peut varier
            if (select count(*)>0 from dcp where user_id = auth.uid()) then
                insert into utilisateur_verifie (user_id, verifie) values(auth.uid(), true)
                on conflict (user_id) do update set verifie = true;
            end if;

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

COMMIT;
