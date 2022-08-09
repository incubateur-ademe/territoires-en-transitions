-- Revert tet:utilisateur/membre from pg

BEGIN;

drop table if exists test.private_collectivite_membre;

drop table private_collectivite_membre;
drop function collectivite_membres;
drop function update_collectivite_membre_details_fonction;
drop function update_collectivite_membre_fonction;
drop function update_collectivite_membre_champ_intervention;
drop function update_collectivite_membre_niveau_acces;
drop function remove_membre_from_collectivite;
drop type membre_fonction;

-- restore previous version
create or replace function remove_user_from_collectivite(
    collectivite_id integer,
    user_id uuid
) returns json as
$$
declare
    can_remove bool;
begin
    select is_referent_of(collectivite_id) or is_service_role() into can_remove;

    if not can_remove
    then
        -- current user cannot remove anyone
        -- return an error with a reason
        perform set_config('response.status', '401', true);
        return json_build_object('message', 'Vous n''avez pas le droit de retirer des droits pour cette collectivité.');
    else
        -- deactivate the droits
        update private_utilisateur_droit d
        set active      = false,
            modified_at = now()
        where d.collectivite_id = remove_user_from_collectivite.collectivite_id
          and d.user_id = remove_user_from_collectivite.user_id;

        -- return success with a message
        perform set_config('response.status', '200', true);
        return json_build_object('message', 'Les droits on étés retirés à l''utilisateur.');
    end if;
end
$$ language plpgsql security definer;
comment on function remove_user_from_collectivite is
    'Removes a user from a Collectivité: '
        'Will succeed with a code 200 if user have a droit on this collectivité.'
        'Otherwise it will fail wit a code 40x.';

COMMIT;
