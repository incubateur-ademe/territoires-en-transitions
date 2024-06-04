-- Deploy tet:utilisateur/membre to pg

BEGIN;

create or replace function remove_membre_from_collectivite(collectivite_id integer, email text)
    returns json
as
$$
declare
    found_user_id uuid;
begin
    if is_authenticated()
    then
        select u.id into found_user_id from auth.users u where u.email = remove_membre_from_collectivite.email;
        if have_admin_acces(remove_membre_from_collectivite.collectivite_id)
            or auth.uid() = found_user_id
        then -- Admin ou utilisateur avec l'email.
            if found_user_id in (select user_id
                                 from private_utilisateur_droit pud
                                 where pud.collectivite_id = remove_membre_from_collectivite.collectivite_id)
            then -- La suppression concerne un membre.
                update private_utilisateur_droit
                set active      = false,
                    modified_at = now()
                where user_id = found_user_id
                  and private_utilisateur_droit.collectivite_id = remove_membre_from_collectivite.collectivite_id;

                delete from private_collectivite_membre pcm
                where pcm.collectivite_id = remove_membre_from_collectivite.collectivite_id
                    and pcm.user_id = found_user_id;

                return json_build_object('message', 'Les accès de l''utilisateur ont été supprimés.');


            elsif remove_membre_from_collectivite.email in (select i.email
                                                            from utilisateur.invitation i
                                                            where i.collectivite_id = remove_membre_from_collectivite.collectivite_id
                                                              and pending)
            then -- La suppression concerne une invitation.
                update utilisateur.invitation i
                set active = false
                where i.email = remove_membre_from_collectivite.email
                  and i.collectivite_id = remove_membre_from_collectivite.collectivite_id;
                return json_build_object('message', 'L''invitation à été supprimée.');

            end if;

            return json_build_object('error', 'Cet utilisateur n''est pas membre de la collectivité.');
        else -- Ni admin ni utilisateur concerné.
            perform set_config('response.status', '401', true);
            return json_build_object('error',
                                     'Vous n''avez pas les droits admin, vous ne pouvez pas retirer les droits d''accès d''un utilisateur');
        end if;
    end if;
    -- Pas authentifié.
    perform set_config('response.status', '401', true);
end
$$ language plpgsql security definer;
comment on function remove_membre_from_collectivite is
    'Supprime les accès d''un membre si l''utilisateur connecté est admin';

COMMIT;
