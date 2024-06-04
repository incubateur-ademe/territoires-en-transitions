-- Deploy tet:utilisateur/membre to pg

BEGIN;

create or replace function update_collectivite_membre_niveau_acces(collectivite_id integer, membre_id uuid, niveau_acces niveau_acces)
    returns json
as
$$
declare
    invitation_id uuid;
begin
    if have_admin_acces(update_collectivite_membre_niveau_acces.collectivite_id)
    then
        if membre_id in (select user_id
                         from private_utilisateur_droit pud
                         where pud.collectivite_id = update_collectivite_membre_niveau_acces.collectivite_id)
        then
            update private_utilisateur_droit
            set niveau_acces = update_collectivite_membre_niveau_acces.niveau_acces,
                modified_at  = now()
            where user_id = membre_id
              and private_utilisateur_droit.collectivite_id = update_collectivite_membre_niveau_acces.collectivite_id;
        else
            perform set_config('response.status', '401', true);
            return json_build_object('error', 'Cet utilisateur n''est pas membre de la collectivité.');
        end if;
        return json_build_object('message', 'Le niveau d''acces du membre a été mise à jour.');
    else
        perform set_config('response.status', '401', true);
        return json_build_object('error',
                                 'Vous n''avez pas les droits admin, vous ne pouvez pas éditer le niveau d''acces de ce membre.');
    end if;
end
$$ language plpgsql security definer;
comment on function update_collectivite_membre_niveau_acces is
    'Met à jour le niveau d''acces d''un membre si l''utilisateur connecté est admin';

COMMIT;
