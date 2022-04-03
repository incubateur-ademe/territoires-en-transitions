create or replace function collectivite_user_list(id integer)
    returns table
            (
                role_name role_name,
                personnes dcp[]
            )
as
$$
select d.role_name as role_name, array_agg(p) as personnes
from private_utilisateur_droit d
         join dcp p on p.user_id = d.user_id
where d.collectivite_id = collectivite_user_list.id
  and d.active
  and is_any_role_on(collectivite_user_list.id)
group by d.role_name;
$$ language sql security definer;


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
